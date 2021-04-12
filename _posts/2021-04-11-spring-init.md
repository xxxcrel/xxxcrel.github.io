---
layout: post
title: Spring initialization mechanism 
categories: Spring
description: Spring 初始化机制
keywords: Java, Spring, Initialization, Aware 
---

## Spring Bean装载

- 屏蔽BeanFactory的后置加载等其他容器相关扩展, 单独看Bean的装载

Spring IOC会先调用所有注册进来的BeanPostProcessor
 - 实例化Bean(AbstractAutowireCapableBeanFactory.populateBean)
 - 初始化bean(AbstractAutowireCapableBeanFactory.initializeBean)
    * 调用Aware接口(BeanNameAware, BeanClassLoaderAware, BeanFactoryAware)

    * 调用初始化方法(实现了InitializingBean接口的Bean)

在所有Bean实例化后调用实现了SmartInitializingSingleton的Bean
以上为简要概括, 每个过程中有许多Spring内部使用的高级PostProcessor没有概括

- Aware 扩展机制

当我们在定义自己的Bean时,可能会想要获得一个Spring IOC容器的引用(ApplicationContext)

Spring提供了一个接口(ApplicationContextAware)满足这个需求, 它会在bean装载的时候调用这个接口的方法

将ApplicationContext注入到你自己的bean中.

- 深入源码分析:

定位到AbstractApplicationContext.refresh()核心方法
```Java
AbstractApplicationContext.refresh()
public void refresh() throws BeansException, IllegalStateException {
    synchronized (this.startupShutdownMonitor) {
        //....
 
        //...
     
        prepareBeanFactory(beanFactory);
 
        try {
            //....BeanFactory的后置处理等相关操作
 
            // Instantiate all remaining (non-lazy-init) singletons.
            finishBeanFactoryInitialization(beanFactory);
 
            //....
        }
 
        catch (BeansException ex) {
            //....
        }
 
        finally {
            //....
        }
    }
}
```

首先在prepareBeanFactory() 中会先注册一个ApplicationContextAwareProcessor这是一个 BeanPostProcessor

然后将那些Bean中ApplicationContext、Environment等与Aware相关的字段属性设为忽略,这样Spring的依赖注入机制就不会自动给这个字段注入相关引用

而是由Spring自己控制注入时机,即手动调用setApplicationContext等相关接口方法
```Java
prepareBeanFactory()
protected void prepareBeanFactory(ConfigurableListableBeanFactory beanFactory) {
        //....
 
        // Configure the bean factory with context callbacks.
        beanFactory.addBeanPostProcessor(new ApplicationContextAwareProcessor(this));
        beanFactory.ignoreDependencyInterface(EnvironmentAware.class);
        beanFactory.ignoreDependencyInterface(EmbeddedValueResolverAware.class);
        beanFactory.ignoreDependencyInterface(ResourceLoaderAware.class);
        beanFactory.ignoreDependencyInterface(ApplicationEventPublisherAware.class);
        beanFactory.ignoreDependencyInterface(MessageSourceAware.class);
        beanFactory.ignoreDependencyInterface(ApplicationContextAware.class);
        beanFactory.ignoreDependencyInterface(ApplicationStartup.class);
 
        //....
}
```
在上诉准备完成后,ApplicationContext中的Bean还只是一堆Bean配置信息,并没有真正实例化.

而refresh()方法中的finishBeanFactoryInitizalization(BeanFactory)才会触发Bean的最终实例化流程(首次执行)

这个过程的调用过程:
```Java
ApplicationContext.prepareBeanFactory() 
→ DefaultListableBeanFactory.preInstantiateSingletons()
→ AbstractBeanFactory.getBean() 
→ AbstractBeanFactory.doGetBean() 
→ AbstractAutowiredCapableBeanFactory.createBean() * 2 
→ AbstractAutowiredCapableBeanFactory.resolveBeforeInstantiation()
```
而resolveBeforeInstantiztion()中就是触发BeanPostProcessor处理Bean

所以我们自己的Bean中的ApplicaitonContext等字段就是在这个时候通过ApplicationContextAwareProcessor(BeanPostProcessor)注入进去的

注意:

ApplicationContextAwareProcessor只触发下面7个Aware

- EnvironmentAware
- EmbeddedValueResolverAware
- ResourceLoaderAware
- ApplicationEnventPublisherAware
- MessageSourceAware
- ApplicationContextAware
- ApplicationStarupAware

而
- BeanNameAware
- BeanClassLoaderAware
- BeanFactoryAware

他们的触发时机在createBean中的populateBean后的initiializeBean方法中调用