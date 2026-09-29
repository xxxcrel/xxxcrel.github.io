---
layout: post
title: "二叉树的基本操作与 C 语言实现"
date: 2018-09-20 21:57:00 +0800
categories: [cnblogs]
description: "树形结构应该是贯穿整个数据结构的一个比较重要的一种结构，它的重要性不言而喻！ 讲到树！一般都是讨论二叉树，而关于二叉树的定义以及概念这里不做陈诉，可自行搜索。"
source_url: "https://www.cnblogs.com/Crel-Devi/p/9683585.html"
original_title: "二叉树的简单操作（Binary Tree）-克里尔肖"
---
#### 树形结构应该是贯穿整个数据结构的一个比较重要的一种结构，它的重要性不言而喻！

#### 讲到树！一般都是讨论二叉树，而关于二叉树的定义以及概念这里不做陈诉，可自行搜索。

#### 在C语言里面需要实现一个二叉树，我们需要申明一个结构体，而关于其结构体的多种方法

#### 这里也不一一列出，我采用比较通用的方法：

struct TreeNode{

    ElementType Element;

    struct TreeNode \*Left;

    struct TreeNode \*RIght;

};

BinaryTree.h:

```c
#ifndef TREE_H
#define TREE_H

typedef char TreeElementType;

typedef struct TreeNode *PtrToNode;
typedef PtrToNode BinTree;

struct TreeNode
{
    TreeElementType Element;
    struct TreeNode *Left;
    struct TreeNode *Right;
};

BinTree CreateTree();//先序遍历创建二叉树
BinTree IterationCreateTree();//先序非递归创建二叉树

void PreOrderTraversal(BinTree BT);
void IterationPreOrderTraversal(BinTree BT);

void InOrderTraversal(BinTree BT);
void IterationInOrderTraversal(BinTree BT);

void PostOrderTraversal(BinTree BT);
void IterationPostOrderTraversal(BinTree BT);

void LevelTraversal(BinTree BT);

int SumNode(BinTree BT);
int SumLeafNode(BinTree BT);
int Depth(BinTree BT);//输出整个二叉树的深度

#endif
```

整个关于二叉树的操作函数都写了它的递归和迭代版本（层次遍历没有写递归版本），为了保持文件的封装性，将整个关于二叉树的简单操作都封装在一个.c文件里

TreeOperate.c：

```c
#include"BinaryTree.h"
#include"Stack.c"
#include"Queue.c"
#include<stdio.h>
#include<stdlib.h>

#define MaxSize 50//栈和队列的大小

//先序递归创建二叉树
BinTree CreateTree()
{
    TreeElementType ch;
    BinTree BT;
    ch = getchar();
    if(ch == '0')
        BT = NULL;
    else
    {
        BT = (BinTree)malloc(sizeof(struct TreeNode));
        if(NULL == BT)
        {
            printf("Out of space!!!");
            return NULL;
        }
        BT->Element = ch;
        BT->Left = CreateTree();
        BT->Right = CreateTree();
    }
    return BT;
}
            
void PreOrderTraversal(BinTree BT)
{
    if(BT)
    {
        printf("%c ", BT->Element);
        PreOrderTraversal(BT->Left);
        PreOrderTraversal(BT->Right);
    }
}

void InOrderTraversal(BinTree BT)
{
    if(BT)
    {
        InOrderTraversal(BT->Left);
        printf("%c ", BT->Element);
        InOrderTraversal(BT->Right);
    }
}

void PostOrderTraversal(BinTree BT)
{
    if(BT)
    {
        PostOrderTraversal(BT->Left);
        PostOrderTraversal(BT->Right);
        printf("%c ", BT->Element);
    }
}


/*-------------------下面是非递归写法------------------------*/
//先序非递归创建二叉树
BinTree IterationCreateTree()
{
    int Flag[MaxSize] = {0};
    Stack S;
    S = CreatStack(MaxSize);
    TreeElementType ch;
    BinTree Root;
    PtrToNode NewCell, T;
    printf("请输入简单二叉树的元素类似：222003004500600：\n");
    do{
        ch = getchar();
        if(ch == '0')
            NewCell = NULL;
        else
        {
            NewCell = (BinTree)malloc(sizeof(struct TreeNode));
            if(NULL == NewCell)
            {
                printf("Alloc is fairure!!");
                return NULL;
            }
            else
            {
                NewCell->Element = ch;
                NewCell->Left = NewCell->Right = NULL;
            }
        }
        //根节点入栈
        if(IsEmpty(S) && NewCell)
        {
            Push(S, NewCell);
            Root = NewCell;//第一个进栈的为根节点
            Flag[S->TopOfStack] = 0;
        }
        //如果当前(栈顶)节点已经连接左节点，现在连接右节点
        else if(Flag[S->TopOfStack] == 1)
        {
            T = TopAndPop(S);
            T->Right = NewCell;
            if(NewCell)
            {
                Push(S, NewCell);
                Flag[S->TopOfStack] = 0;//元素进栈后都要置为0，清除隐患
            }
        }
        //该左孩子节点入栈，并连接父亲节点
        else
        {
            Flag[S->TopOfStack] = 1;//父亲结点标记为1，表示已经连接左结点
            //下面是连接左结点的代码
            T = Top(S);
            T->Left = NewCell;
            if(NewCell)
            {
                Push(S, NewCell);
                Flag[S->TopOfStack] = 0;//元素进栈后都要置为0，清除隐患
            }
        }
    }while(!IsEmpty(S));

    return Root;
}
//先序
void IterationPreOrderTraversal(BinTree BT)
{
    Stack S;
    S = CreatStack(MaxSize);
    BinTree T = BT;
    while(T || !IsEmpty(S))
    {
        while(T)
        {
            Push(S, T);
            //注意printf的顺序，因为他是在访问左孩子节点时就已经处理了！
            printf("%c ", T->Element);
            T = T->Left;
        }
        if(T == NULL)
        {
            T = TopAndPop(S);
            T = T->Right;
        }
    }
}
//中序
void IterationInOrderTraversal(BinTree BT)
{
    Stack S;
    S = CreatStack(MaxSize);
    BinTree T = BT;
    while(T || !IsEmpty(S))
    {
        while(T)
        {
            Push(S, T);
            T = T->Left;
        }
        if(T == NULL)
        {
            T = TopAndPop(S);
            //printf在访问右孩子之前就处理的当前元素
            printf("%c ", T->Element);
            T = T->Right;
        }
    }
}
//后序
//void IterationPostOrderTraversal(BinTree BT)
//{
//    int Flag[MaxSize];
//    Stack S;
//    S = CreatStack(MaxSize);
//    BinTree T = BT;
//    while(T || !IsEmpty(S))
//    {
//        while(T)
//        {
//            Push(S, T);
//            Flag[S->TopOfStack] = 0;//未处理的标记为0
//            T = T->Left;
//        }
//        while(Flag[S->TopOfStack] == 1)
//        {
//            T = TopAndPop(S);
//            printf("%c ", T->Element);
//            T = NULL;//该节点被处理后，父亲节点的右孩子置空
//        }
//        if(!IsEmpty(S))
//        {
//            T = Top(S);
//            T = T->Right;
//          Flag[S->TopOfStack] = 1;
//        }
//    }
//}
//第二种版本
void IterationPostOrderTraversal(BinTree BT)
{
    int Flag[MaxSize] = {0};
    Stack S;
    S = CreatStack(MaxSize);
    BinTree T = BT;
    while(T || !IsEmpty(S))
    {
        /*将左结点全部入栈*/
        if(T)
        {
            Push(S, T);
            Flag[S->TopOfStack] = 0;//未处理的标记为0
            T = T->Left;
        }
        /*如果已经访问了该结点的右孩子，将它出队并打印*/
        else if(Flag[S->TopOfStack] == 1)
        {
            T = TopAndPop(S);
            printf("%c ", T->Element);
            T = NULL;//该节点被处理后置空，否则会被识别入栈
        }
        /*如果左孩子为空，则访问它的右孩子*/
        else
        {
            T = Top(S);
            T = T->Right;
            Flag[S->TopOfStack] = 1;//访问了右孩子，标记为1
        }
    }
}
//层次
void LevelTraversal(BinTree BT)
{
    Queue Q;
    Q = CreatQueue(MaxSize);
    BinTree T = BT;
    Enqueue(Q, T);
    while(!QIsEmpty(Q))
    {
        T = FrontAndDequeue(Q);
        printf("%c ", T->Element);
        if(T->Left)
            Enqueue(Q, T->Left);
        if(T->Right)
            Enqueue(Q, T->Right);
    }
}

int SumNode(BinTree BT)
{
    if(NULL == BT)
        return 0;
    else if(BT->Left == NULL && BT->Right == NULL)
        return 1;
    else
        return SumNode(BT->Left) + SumNode(BT->Right) + 1;//加1等于是每次返回 加一个根结点
}

int SumLeafNode(BinTree BT)
{
    if(NULL == BT)
        return 0;
    else if(BT->Left == NULL && BT->Right == NULL)
        return 1;
    else
        return SumLeafNode(BT->Left) + SumLeafNode(BT->Right);
}

int Depth(BinTree BT)//输出的是整个二叉树的深度
{
    int DepthOfLeft = 0;
    int DepthOfRight = 0;
    if(NULL == BT)
        return 0;
    else
    {
        DepthOfLeft = Depth(BT->Left);
        DepthOfRight = Depth(BT->Right);
        return (DepthOfLeft > DepthOfRight) ? DepthOfLeft + 1 : DepthOfRight + 1;
    }
}
```

上文用到的栈的操作和队列的操作出自https://www.cnblogs.com/Crel-Devi/p/9460945.html和https://www.cnblogs.com/Crel-Devi/p/9600940.html,需修改栈和队列同名的函数名称以及Element的名字以及栈和队列的元素类型！！！！！！！（非常重要）

下面给出一个简单的测试代码main.c:

```c
#include"BinaryTree.h"
#include<stdio.h>
#include<stdlib.h>

/* run this program using the console pauser or add your own getch, system("pause") or input loop */

int main(int argc, char *argv[]) {
    BinTree BT;
    printf("请输入二叉树的元素:");
    BT = CreateTree();
    //BT = IterationCreateTree();

    printf("先序遍历(递归)：\t");
    PreOrderTraversal(BT);
    printf("\n");
    printf("先序遍历(迭代)：\t");
    IterationPreOrderTraversal(BT);
    printf("\n\n");

    printf("中序遍历(递归)：\t");
    InOrderTraversal(BT);
    printf("\n");
    printf("中序遍历(迭代)：\t");
    IterationInOrderTraversal(BT);
    printf("\n\n");

    printf("后序遍历(递归)：\t");
    PostOrderTraversal(BT);
    printf("\n");
    printf("后序遍历(迭代)：\t");
    IterationPostOrderTraversal(BT);
    printf("\n\n");
    
    printf("层次遍历(迭代)：\t");
    LevelTraversal(BT);
    printf("\n\n");
    
    int allnode, leafnode, treedepth;
    allnode = SumNode(BT);
    leafnode = SumLeafNode(BT);
    treedepth = Depth(BT);
    printf("二叉树结点总数：%d\t\n", allnode);
    printf("二叉树叶节点总数：%d\t\n", leafnode);
    printf("二叉树深度：%d\t\n", treedepth);//输出整棵树的深度
    printf("\n");

    return 0;
}
```

![文章插图](/images/posts/cnblogs/1457277-20180920215703882-106950457.png)
