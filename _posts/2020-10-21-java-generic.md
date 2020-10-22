---
layout: post
title: java泛型笔记
categories: java generic
description: 
keywords: Generic, Java
---

## Java泛型笔记

- ### 为什么使用泛型
  
  1. 增强代码复用性 
  2. 有更强大的语义去写容器库

- ### 简单泛型栗子
  ```Java
  public class LinkedStack<T> {
    private Node<T> top;
    private int size;

    private static class Node<T> {
        private T item;
        private Node<T> next;
    }

    public LinkedStack() {
        top = null;
        int size = 0;
    }

    public void push(T item) {
        Node<T> oldTop = top;
        top = new Node<T>();
        top.item = item;
        top.next = oldTop;
        size++;
    }

    public boolean isEmpty() {
        return top == null;
    }

    public int size(){
        return size;
    }

    public T pop() {
        if (isEmpty()) {
            throw new NoSuchElementException("Stack underflow");
        }
        T item = top.item;
        top = top.next;
        size--;
        return item;
    }

    public T peek() {
        if (isEmpty()) {
            throw new NoSuchElementException("Stack underflow");
        }
        return top.item;
    }

    public static void main(String[] args) {
        LinkedStack<String> stack = new LinkedStack<>();
        LinkedStack<Integer> stack1 = new LinkedStack<>();
        stack.push("hello");
        stack.push("world");
        stack1.push(1);
        stack1.push(2);
    }
    ```
    似乎泛型按照我们设想的那样,将T占位符换成的我们声明的参数`String`, `Integer`并生成了两个不同的Stack.但是结果并不是, 它们仍然是相同的类型
    ```Java
    public static void main(String[] args) {
        Class c1 = new ArrayList<String>().getClass();
        Class c2 = new ArrayList<Integer>().getClass();
        System.out.println(c1 == c2);
    }
    //output: true
    ```
    Java并不是从1.0就开始有泛型的,这是在5.0后才增加的新特性,而如果像上面的就已经存在的Stack类库(item类型那个为Obejct),并且已经很多公司在用,如果这时候贸然升级成我们想象中的泛型, 那这些类库使用者将会是一个巨大的灾难,所以Java采取了一个折中(也可以说妥协)的方式
    `泛型擦除`.

    简单例子
    ```Java
    public class Holder<T> {
        private T item;
        public Holder(T item){
            this.item = item;
        }

        public T getItem() {
            return item;
        }

        public static void main(String[] args) {
            Holder<String> holder = new Holder<>("hello");
            String hello = holder.getItem();
        }
    }
    ```
    运行`javap -v Holder`
    ```Java
    Constant pool:
    #1 = Methodref          #8.#26         // java/lang/Object."<init>":()V
    #2 = Fieldref           #3.#27         // Holder.item:Ljava/lang/Object;

    public T getItem();
    descriptor: ()Ljava/lang/Object;
    Code:
         0: aload_0
         1: getfield      #2                  // Field item:Ljava/lang/Object;
         4: areturn

    public static void main(java.lang.String[]);
    descriptor: ([Ljava/lang/String;)V
    Code:
        11: invokevirtual #6                  // Method getItem:()Ljava/lang/Object;
        14: checkcast     #7                  // class java/lang/String
        17: astore_2
        18: return
    ```
    从上面的Fieldref为Object可知, T被擦除到它的上边界,编译器自动加了`<T extends Object>`,也就是说T其实就是Object.

    继续验证,现在设置T的边界为Bird
    ```Java
    class Bird{

    }

    class Crow extends Bird{

    }

    public class Holder<T extends Bird>{
        ...
    }
    ```

    由javap可得如下
    ```Java
    Constant pool:
    #1 = Methodref          #8.#26         // java/lang/Object."<init>":()V
    #2 = Fieldref           #3.#27         // Holder.item:LBird;

    public T getItem();
    descriptor: ()LBird;
    Code:
      stack=1, locals=1, args_size=1
         0: aload_0
         1: getfield      #2                  // Field item:LBird;
         4: areturn
    ```

    这里T被擦除到Bird,相当于在Holder中定义`Bird item;`, 也就是说我们想象的美好生活都被java编译器神秘的替换了,那main方法中的代码是如何正确运行的呢?

    上面main中holder.getItem()生成的字节码如下
    ```Java
    11: invokevirtual #6                  // Method getItem:()Ljava/lang/Object;
    14: checkcast     #7                  // class java/lang/String
    ```
    在调用相应的getItem()后会有一条checkcast指令,官方定义为检查是否能转型成给定的类型, 即getItem()的类型是否能转型为String. 所以java泛型采用类型擦除.即Java泛型是编译器的行为,虚拟机根本不知道泛型的存在.

- ### 更抽象

    现在假设我有一个方法用来打印一个集合(Collection),如下

    ```Java
    //出自官方
    //5.0之前
    void printCollection(Collection c) {
        Iterator i = c.iterator();
        for (k = 0; k < c.size(); k++) {
            System.out.println(i.next());
        }
    }
    //尝试使用泛型
    //但是只能传入Collection<Object>
    void printCollection(Collection<Object> c) {
        for (Object e : c) {
            System.out.println(e);
        }
    }
    ```
    然而没啥用,并没有带来任何便利和语义上的清晰

    #### 使用通配符`?`
    ```Java
    void printCollection(Collection<?> c) {
        for (Object e : c) {
            System.out.println(e);
        }
    }
    ```
    现在似乎可以了,但现在有个新需求,我希望这个Collection是某个限定类型的子类.

    #### 更具体的`extends`
    ```Java
    abstract class Bird{
        abstract void speak();
    }

    class Crow extends Bird{
        @Override
        void speak() {
            System.out.println("gaga gaga");
        }
    }

    class Cuckoo extends Bird{
        @Override
        void speak() {
            System.out.println("bugu bugu");
        }
    }
    
    void speak(List<? extends Bird> birds){
        for(Bird bird : birds)
            bird.speak();
    }

    List<Crow> crows = Arrays.asList(new Crow());
    List<Cuckoo> cuckoos = Arrays.asList(new Cuckoo());
    speak(crows);
    speak(cuckoos);
    ```
    speak方法表达的是:我接受任何Bird或Bird的子类的列表,
    并且在其上调用`bird.speak()`是语义安全的.

    __为什么要这样写?__

    ```Java
    //编译错误, 编译器不会去知道Crow是Bird的子类
    List<Bird> birds = new ArrayList<Crow>();
    ```
    所以List<? extends Bird> birds表达的意思是, birds:我能保证我里面放的是Bird或者他的子类,你可以取出来当Bird使用.

    但是,这时候如果想要往里面添加一些东西, 比如:
    ```Java
    void speak(List<? extends Bird> birds){
        birds.add(new Cuckoo());//编译错误
        birds.add(new Crow());//同上
    }
    //当我们调用speak方法的时候,speak是不知道传入的是List<Cuckoo> 还是List<Crow>, 
    //如果往里面添加了不正确的类型, 如传入的是List<Cuckoo>但是却add(new Crow()), 那么对传入的birds是属于破坏的行为, 你不能保证之后对birds的使用都是在调用Bird里面的相同的方法.
    ```

    __春天的到来:`super`__

    有时候就有这么一个需求, 有一个方法接收一个泛化的列表,并且向里面添加一些似乎合道理的东西.毕竟下面是合法且合理的:
    ```Java
    List<Bird> birds = new ArrayList<Bird>();
    birds.add(new Cuckoo());
    ```
    但是这个birds只能接受`List<Bird>`列表,
    使用`super`
    ```Java
    //可加工的
    interface Processable{

    }
    //可出售的
    interface Salable{
        
    }
    class Fruit{

    }
    class Apple extends Fruit implements Processable, Salable{
    }

    class RedApple extends Apple{

    }

    class YellowApple extends Apple{

    }

    class Banana extends Fruit{

    }
    void addToAppleStore(List<? super Apple> apples){
        apples.add(new RedApple());
        apples.add(new YellowApple());
    }
    ```
    `addToAppleStore`表达的意思是:我接受一个列表(仓库),并且这个仓库可能是Fruit, 也可能是可加工的(Processable), 也可能是可出售的(Salable),所以向里面添加任何Apple或者Apple子类是安全且正确的.但是这时候我们如果想要上面`extends`语法的便利性去调用Apple中的方法时,那么将会获得一个编译错误.
    __为什么?__ 
    因为List的边界是lower boundes,所以传入的List中的元素不一定拥有Apple中的方法, 比如传入List<Processable> 那么Processable中没有Apple中的方法的.

