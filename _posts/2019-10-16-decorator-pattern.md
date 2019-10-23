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

### 通过对`Java I/O`的剖析来学习装饰器模式

- **Java I/O 类图(JDK1.8)**

![Java I/O](/images/posts/java/input_output_img.png)

- **分析**

    1. 抽象组件类：InputStream，OutputStream
    2. 具体组件类：提供字节流的输入输出ByteArrayInputStream，FileOutputStream等等
    3. 抽象装饰器类：FilterInputStream，FilterOutputStream
    3. 具体装饰器：为组件提供额外的功能，如BufferedInputStream提供缓冲功能
- **模式定义**

    *动态的将责任附加到对象上,若要扩展功能, 装饰器提供了比继承更有弹性的替代方案*

- **代码示例**

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
