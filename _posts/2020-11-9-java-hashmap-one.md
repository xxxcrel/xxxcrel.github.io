---
layout: post
title: Java HashMap
categories: Java
description: 
keywords: Java, Map, HashMap
---

## Java HashMap笔记一

- Java中的HashMap采用分离链表法(拉链法)实现

    **各大博客文章有图**

- 准备容器大小和hash函数(保证容器的大小一定是2的幂, 16, 32, 64...) 
  
    **取得当前数的下一个2的最小幂, 如63->64, 129->256, 256->256**

    **技巧在于通过`与`操作和无符号右移31位(满足int类型极值情况)取得下一次2的最小幂方** 

    **如0000-1101-0111-0101 -> 0000-1101-0111-0100 -> 0000-1111-1111-1111.**

    **极限值:0001-0000-0000-0000 -> 0000-1111-1111-1111 -> 0000-1111-1111-1111.**

    **最后加1获得0001-0000-0000-0000.**

    **第一行的-1用来处理恰好情形如64, 256**

    ```Java
    static final int MAXIMUM_CAPACITY = 1 << 30;

    int tableSizeFor(int cap){
        int n = cap - 1;
        n |= n >>> 1;
        n |= n >>> 2;
        n |= n >>> 4;
        n |= n >>> 8;
        n |= n >>> 16;
        return (n < 0) ? 1 : (n >= MAXIMUM_CAPACITY) ? MAXIMUM_CAPACITY : n + 1;
    }

    static final int hash(Object key) {
        int h;
        return (key == null) ? 0 : (h = key.hashCode()) ^ (h >>> 16);
    }
    ```
- put(K key, V value), 内部调用putVal

    **`重点1`:i = (n - 1) & hash, n为容器大小且为2的幂方, 所以这段代码通过`&`取hash值的最后符合容器大小的位数,所以即使两个hash值不同, 也有可能发生hash碰撞**
    eg:hashCode返回0x00-00-00-01和0x00-03-00-02;
    通过上面的hash(key)变成0x00-00-00-01和0x00-03-00-01;
    设n = 16, 那么n-1:0x00-00-00-7F,那么(n - 1) & 上面的两个hash值获得结果一致发生hash碰撞

    **`重点2`:当发生hash碰撞时通过遍历Node的next指针至末尾,如hash和key相同则更新value, 不同则最后插入, 但是当binCount(node节点的数量)达到一个阈值时(默认是8)则将其转换成红黑数提高查询效率**

    **`重点3`:key相同有两种情况,他们是用一个对象引用, 或者非空且equals返回true**

    **`重点4`:从hash函数中可以得知put方法的Key可以为null, 而null值也就相当于0**

    **这就是当需要把对象作为hash容器的key时需要覆写`hashCode`和`equals`的原因**
    ```Java
    final V putVal(int hash, K key, V value, boolean onlyIfAbsent,
                   boolean evict) {
        Node<K,V>[] tab; Node<K,V> p; int n, i;
        if ((tab = table) == null || (n = tab.length) == 0)
            n = (tab = resize()).length;
        //无hash碰撞,直接插入
        if ((p = tab[i = (n - 1) & hash]) == null)
            tab[i] = newNode(hash, key, value, null);
        else {//有hash碰撞
            Node<K,V> e; K k;
            //hash值和key相同直接更新value
            if (p.hash == hash &&
                ((k = p.key) == key || (key != null && key.equals(k))))
                e = p;
            //插入至红黑树
            else if (p instanceof TreeNode)
                e = ((TreeNode<K,V>)p).putTreeVal(this, tab, hash, key, value);
            else {//通过遍历链表插入到尾部,如hash和key相同则退出并更新value, 否则放入尾部
                for (int binCount = 0; ; ++binCount) {
                    if ((e = p.next) == null) {
                        p.next = newNode(hash, key, value, null);
                        //达到树化的阈值,进行红黑树的转化
                        if (binCount >= TREEIFY_THRESHOLD - 1) // -1 for 1st
                            treeifyBin(tab, hash);
                        break;
                    }
                    if (e.hash == hash &&
                        ((k = e.key) == key || (key != null && key.equals(k))))
                        break;
                    p = e;
                }
            }
            if (e != null) { // existing mapping for key
                V oldValue = e.value;
                if (!onlyIfAbsent || oldValue == null)
                    e.value = value;
                afterNodeAccess(e);
                return oldValue;
            }
        }
        ++modCount;
        if (++size > threshold)
            resize();
        afterNodeInsertion(evict);
        return null;
    }
    ```
- get(K key)内部调用getNode 
    
    **同put一样通过(n - 1) & hash获得内部数组的索引,如果找到,则通过遍历当前桶中的Node查找**
    ```Java
    final Node<K,V> getNode(int hash, Object key) {
        Node<K,V>[] tab; Node<K,V> first, e; int n; K k;
        if ((tab = table) != null && (n = tab.length) > 0 &&
            (first = tab[(n - 1) & hash]) != null) {
            //
            if (first.hash == hash && // always check first node
                ((k = first.key) == key || (key != null && key.equals(k))))
                return first;
            if ((e = first.next) != null) {
                if (first instanceof TreeNode)
                    return ((TreeNode<K,V>)first).getTreeNode(hash, key);
                do {
                    if (e.hash == hash &&
                        ((k = e.key) == key || (key != null && key.equals(k))))
                        return e;
                } while ((e = e.next) != null);
            }
        }
        return null;
    }
    ```