---
layout: post
title: Timing Wheel
categories: powerjob
description: 时间轮算法笔记(powerjob实现)
keywords: Java, powerjob, 分布式, Timing Wheel, 时间轮
---

## 时间轮算法(Powerjob实现)

### powerjob时间轮算法实现:

概览图:

![fail](/images/posts/powerjob/timing-wheel-overview.png)

一个时间轮有ticksPerWheel个槽

每个槽是一个桶, 这个桶其实就是一个链表

每走一个时间间隔(槽的时间间隔)则指针向前走一格,然后执行当前桶内的所有任务

### powerjob实现概览:

![fail](/images/posts/powerjob/powerjob-timing-wheel-overview.png)

HashedWheelBucket就是代表每个槽的桶,里面装了当前槽内需要执行的任务、

为了以O(1)时间复杂度获取当前槽(Bucket), 内部使用一个Bucket数组来表示

private final HashedWheelBucket[] wheel;
HashedWheelTimerFuture里面封装了我们需要执行的的任务

*Indicator就是控制整个时间轮转动和执行桶内任务的主要线程*

### 构造方法:

tickDuration确定时间轮的转动频率, 类比手表指针转动频率

ticksPerWheel确定时间轮槽数量, 类比手表指针数量

processThreadNum未执行当前槽的线程数量,根据业务进行优化
```Java
public HashedWheelTimer(long tickDuration, int ticksPerWheel, int processThreadNum) {
 
        this.tickDuration = tickDuration;
 
        // 初始化轮盘，大小格式化为2的N次
        int ticksNum = CommonUtils.formatSize(ticksPerWheel);
        wheel = new HashedWheelBucket[ticksNum];
        for (int i = 0; i < ticksNum; i++) {
            wheel[i] = new HashedWheelBucket();
        }
        //& mask等价于(%取余操作)
        mask = wheel.length - 1;
 
        // 初始化执行线程池
        if (processThreadNum <= 0) {
            taskProcessPool = null;
        }else {
            ThreadFactory threadFactory = new ThreadFactoryBuilder().setNameFormat("HashedWheelTimer-Executor-%d").build();
            BlockingQueue<Runnable> queue = Queues.newLinkedBlockingQueue(16);
            int core = Math.max(Runtime.getRuntime().availableProcessors(), processThreadNum);
            taskProcessPool = new ThreadPoolExecutor(core, 4 * core,
                    60, TimeUnit.SECONDS,
                    queue, threadFactory, RejectedExecutionHandlerFactory.newCallerRun("PowerJobTimeWheelPool"));
        }
 
        startTime = System.currentTimeMillis();
 
        // 启动后台线程
        indicator = new Indicator();
        new Thread(indicator, "HashedWheelTimer-Indicator").start();
    }
```
### Indicator.run()解析:

![fail](/images/posts/powerjob/powerjob-indicator-run.png)
该部分代码是整个时间轮的核心运行逻辑:

```Java
public void run() {
 
            while (!stop.get()) {
 
                // 1. 将任务从队列推入时间轮
                pushTaskToBucket();
                // 2. 处理取消的任务
                processCanceledTasks();
                // 3. 等待指针跳向下一刻
                tickTack();
                // 4. 执行定时任务
                int currentIndex = (int) (tick & mask);
                HashedWheelBucket bucket = wheel[currentIndex];
                bucket.expireTimerTasks(tick);
 
                tick ++;
            }
            latch.countDown();
        }
```

1. pushTaskToBucket(): 将任务队列的超时任务经过计算推入相应槽的Bucket中

2. 根据初始化传入的tickDuration进行睡眠,指针进入下一个槽

3. 取得当前槽并运行槽中任务

实现细节:

1. 根据传入的延时时间构造HashedWheelTimerFuture

//targetTime为任务运行时间点
long targetTime = System.currentTimeMillis() + unit.toMillis(delay);
HashedWheelTimerFuture timerFuture = new HashedWheelTimerFuture(task, targetTime);
然后在pushTaskToBucket中计算该任务所在槽:

// 总共的偏移量
long offset = timerTask.targetTime - startTime;
// 总共需要走的指针步数
timerTask.totalTicks = offset / tickDuration;
// 取余计算 bucket index
int index = (int) (timerTask.totalTicks & mask);
假设时间轮开始运行时间startTime=10000ms, tickDuration=50ms, ticksPerWheel=10

一个新超时任务需求为每5000ms运行一次:

在时间轮运行20000ms后放入时间轮中, targetTime为35000ms

offset = 35000 - 10000 = 25000

totalTicks = 500

index = 500 & 9 = 0

所以这个任务被放在0号槽

2. 长超时任务, 一轮时间轮运行时间不足够运行该任务

如上的超时任务, 他虽然在0号槽, 但是却不在这一圈总执行,那么在expireTimerTasks需要判断机制决定该任务是否在该轮执行:

currentTick为走过的tick数, 该值随着时间增加(每调用一次tickTack()则加1)

最红根据totalTicks和currentTick的比较确认是否本轮调度, 如果totalTicks大于当前的指针步数, 则说明该任务不在本轮调度, 直接pass
```Java
// 本轮直接调度
 if (timerFuture.totalTicks <= currentTick) {
    if (timerFuture.totalTicks < currentTick) {
          log.warn("[HashedWheelTimer] timerFuture.totalTicks < currentTick, please fix the bug");
       }
 
       try {
          // 提交执行
          runTask(timerFuture);
       }catch (Exception ignore) {
       } finally {
          timerFuture.status = HashedWheelTimerFuture.FINISHED;
       }
       return true;
 }
```