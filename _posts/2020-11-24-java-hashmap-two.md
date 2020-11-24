---
layout: post
title: Java HashMap
categories: Java
description: 
keywords: Java, Map, HashMap
---

## Java HashMap笔记二

- HashMap的resize(阿成直呼妙啊)
  
    **上源码**
    ```Java
    final Node<K,V>[] resize() {
        Node<K,V>[] oldTab = table;
        int oldCap = (oldTab == null) ? 0 : oldTab.length;
        int oldThr = threshold;
        int newCap, newThr = 0;
        //分析三
        if (oldCap > 0) {
            if (oldCap >= MAXIMUM_CAPACITY) {
                threshold = Integer.MAX_VALUE;
                return oldTab;
            }
            else if ((newCap = oldCap << 1) < MAXIMUM_CAPACITY &&
                     oldCap >= DEFAULT_INITIAL_CAPACITY)
                newThr = oldThr << 1; // double threshold
        }
        //分析二
        else if (oldThr > 0) // initial capacity was placed in threshold
            newCap = oldThr;
        //分析一
        else {               // zero initial threshold signifies using defaults
            newCap = DEFAULT_INITIAL_CAPACITY;
            newThr = (int)(DEFAULT_LOAD_FACTOR * DEFAULT_INITIAL_CAPACITY);
        }
        if (newThr == 0) {
            float ft = (float)newCap * loadFactor;
            newThr = (newCap < MAXIMUM_CAPACITY && ft < (float)MAXIMUM_CAPACITY ?
                      (int)ft : Integer.MAX_VALUE);
        }
        threshold = newThr;
        @SuppressWarnings({"rawtypes","unchecked"})
        Node<K,V>[] newTab = (Node<K,V>[])new Node[newCap];
        table = newTab;
        if (oldTab != null) {
            for (int j = 0; j < oldCap; ++j) {
                Node<K,V> e;
                if ((e = oldTab[j]) != null) {
                    oldTab[j] = null;
                    if (e.next == null)
                        newTab[e.hash & (newCap - 1)] = e;
                    else if (e instanceof TreeNode)
                        ((TreeNode<K,V>)e).split(this, newTab, j, oldCap);
                    else { // preserve order
                        Node<K,V> loHead = null, loTail = null;
                        Node<K,V> hiHead = null, hiTail = null;
                        Node<K,V> next;
                        //分析四
                        do {
                            next = e.next;
                            if ((e.hash & oldCap) == 0) {
                                if (loTail == null)
                                    loHead = e;
                                else
                                    loTail.next = e;
                                loTail = e;
                            }
                            else {
                                if (hiTail == null)
                                    hiHead = e;
                                else
                                    hiTail.next = e;
                                hiTail = e;
                            }
                        } while ((e = next) != null);
                        if (loTail != null) {
                            loTail.next = null;
                            newTab[j] = loHead;
                        }
                        if (hiTail != null) {
                            hiTail.next = null;
                            newTab[j + oldCap] = hiHead;
                        }
                    }
                }
            }
        }
        return newTab;
    }
    ```

    分析一:直接new HashMap()时, 第一次调用put后会resize并初始化table = 16, threshold = 12(16 * 0.75)
    分析二:创建HashMap时传入了初始大小, 第一次调用put后resize并初始化table为传入的初始大小的下一个最大2次幂,并重置threshold, 一和二都是属于懒加载
    分析三:当table不为空,且在规定范围内,则double table和double threshold
    分析四:这里非常精妙,这段循环的作用即将在oldCap时发生hash碰撞的链表归化为newCap大小时的链表,由于table的大小每次resize只增大了两倍, 所以每个Node的hash & (newCap -1)后只有两种情况.(具体分析请看[HashMap](https://tech.meituan.com/2016/06/24/java-hashmap.html)), 所以这段代码用过遍历链表, 将可以放到newTab中的Node组成新的链表并放到[oldCap + j]的位置
    
    oldCap: 16        
    1111 0000 010`1` 0010              1111 0000 010`0` 0010 hashCode
    ------------------- &              ------------------- &
    0000 0000 0000 1111                0000 0000 0000 1111   (oldCap - 1)
    0000 0000 000`0` 0010              0000 0000 000`0` 0010

    newCap: 32
    1111 0000 010`1` 0010              1111 0000 010`0` 0010 hashCode
    ------------------- &              -------------------- &
    0000 0000 0001 1111                0000 0000 0001 1111    (newCap - 1)
    0000 0000 000`1` 1111              0000 0000 000`0` 1111


    **最后: 与笔记一一样没有分析红黑树的节点如何resize**
    
    

