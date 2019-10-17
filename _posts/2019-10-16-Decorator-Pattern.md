---
layout: post
title: 一天一个设计模式(装饰器模式)
categories: Java
description: 
keywords: Java, Design Pattern, Decorator-Pattern
---

#### 参考书籍

- `<Head First Design Pattern>`  
- `<Think In Java>`

#### 通过对`Java I/O`的剖析来学习装饰器模式

- Java I/O 类图(JDK1.8)

![Java I/O](/images/posts/java/img_java_io.png)

- 浅析(以input为例))

    1.Component下时`抽象组件类`,Java I/O用四个类来描述字节输入/输出(`InputStream`, `OutputStream`), 字符输入输出(`Reader`, `Writer`).
    > 这些类全部都是abstract 修饰的类,而不是纯粹的接口.

    2.ConcreteComponent下是`具体的组件类`,用来实现到各种涉及输入输出的抽象形式
    其中输入相关包括`ByteArrayInputStream`, `FileInputStream`, `PipedInputStream`, `StringBufferInputStream`(以弃用),`ObjectInputStream`, `SequenceInputStream`.
    > 这些具体组件类都直接继承至Component下的抽象组件类,用来实现特定的逻辑和功能,这些类将会被`装饰器`包裹,即装饰器类(下)中包含有这些类的实例.

    3.Decorator下是四个抽象`装饰器类`, 他们同样直接继承至Component下相应的抽象类,但这些抽象装饰器类并不做任何事,只是简单的将任务交给它所装饰的类的实例执行.
    > 其中`FilterWriter`没有任何子类实现(JDK8中),就好像一个占位符(仿佛再说:是金子总会发光的).

    3.ConcreteComponent下是`具体的装饰器`, 他们继承相应的`FilterXXX`抽象类,用来实现真正想要装饰的功能, 如BufferedInputStream内部会保存一个Byte数组buf用来缓存(当你想要很多数据时,这是一个很好的做法)
    > Reader和Writer与InputStream/OutputStream的方式会有些不同,但大致行为相似,值得注意的有:BufferReader属于装饰器类,但其直接继承至Reader,后面会做分析

- 模式定义

    `动态的将责任附加到对象上,若要扩展功能, 装饰器提供了比继承更有弹性的替代方案`