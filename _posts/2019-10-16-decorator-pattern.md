---
layout: post
title: 一天一个设计模式(装饰器模式)
categories: Java
description: 
keywords: Java, Design Pattern, Decorator-Pattern
---

## 参考书籍

- `<Head First Design Pattern>`  
- `<Think In Java>`

## 通过对`Java I/O`的剖析来学习装饰器模式

- ## Java I/O 类图(JDK1.8)

![Java I/O](/images/posts/java/img_java_io.png)

- ## 浅析(以input为例))

    1.*Component*下是*抽象组件类*,Java I/O用四个类来描述字节输入/输出(`InputStream`, `OutputStream`), 字符输入/输出(`Reader`, `Writer`).
    > 这些类全部都是abstract 修饰的类,而不是纯粹的接口. 因为我们不常常能够控制所有,也许这些抽象类是有其他人提供的让你来设计一个方案处理需求

    2.*ConcreteComponent*下是*具体组件类*,用来实现到各种涉及输入输出的抽象形式
    其中输入相关包括`ByteArrayInputStream`, `FileInputStream`, `PipedInputStream`, `StringBufferInputStream`(以弃用),`ObjectInputStream`, `SequenceInputStream`.
    > 这些具体组件类都直接继承至Component下的抽象组件类,用来实现特定的逻辑和功能,这些类将会被`装饰器`包裹,即装饰器类(下)中包含有这些类的实例.

    3.*Decorator*下是四个*抽象装饰器类*, 他们同样直接继承至Component下相应的抽象类,但这些抽象装饰器类并不做任何事,只是简单的将任务交给它所装饰的类的实例执行.
    > 其中`FilterWriter`没有任何子类实现(JDK8中),就好像一个占位符(仿佛再说:是金子总会发光的).
    > 这些抽象装饰器类之所以继承至抽象类,并不是为了获取他们的行为,而是为了有正确的类型,利用继承达到*类型匹配*,

    3.*ConcreteComponent*下是*具体装饰器*, 他们继承相应的`FilterXXX`抽象类,用来实现真正想要装饰的功能, 如BufferedInputStream内部会保存一个Byte数组buf用来缓存(当你想要很多数据时,这是一个很好的做法)
    > Reader和Writer与InputStream/OutputStream的方式会有些不同,但大致行为相似,值得注意的有:BufferReader属于装饰器类,但其直接继承至Reader,后面会做分析

- ## 模式定义

    *动态的将责任附加到对象上,若要扩展功能, 装饰器提供了比继承更有弹性的替代方案*

- ## 代码示例

    ```Java
    public static void main(String[] args) throws IOException
    {
        DataOutputStream out = new DataOutputStream(new BufferedOutputStream(new FileOutputStream("test.txt")));
        out.writeUTF("java io");
        out.writeInt(47);
        out.writeDouble(3.14);
        out.writeUTF("hello world");
        out.close();
        DataInputStream in = new DataInputStream(new BufferedInputStream(new FileInputStream("test.txt")));
        System.out.println(in.readUTF());
        System.out.println(in.readInt());
        System.out.println(in.readDouble());
        System.out.println(in.readUTF());
        in.close();
    }
    ```

    *out*

    ```txt
    java io
    47
    3.14
    hello world
    ```

    *分析*

    `FileOutputStream`和`FileInputStream`是具体的流,他们用来生成特定行为的*基础流*,这里指以文件为载体进行输入输出,

    `BufferedOutputStream`和`BufferedInputStream`相当于在基础流上动态增加的一些功能, `DataOutputStream`和`DataInputStream`同理.所以我们也可以自己通过继承自`FilterXXX`这些抽象装饰器类来增加自己想要的功能.

    *编写自己的I/O装饰器*

    `LowerCaseInputStream.java`

    ```Java
    public class LowerCaseInputStream extends FilterInputStream
    {
        public LowerCaseInputStream(InputStream in)
        {
            super(in);
        }

        public int read() throws IOException
        {
            int c = in.read();
            return (c == -1 ? c : Character.toLowerCase((char)c));
        }

        public int read(byte[] b, int off, int len) throws IOException
        {
            int result = super.read(b, off, len);
            for(int i = off; i < off+result; ++i)
                b[i] = (byte)Character.toLowerCase((char)b[i]);
            return result;
        }
    }
    ```

    >这里只是简单的将字符装换为小写形式
