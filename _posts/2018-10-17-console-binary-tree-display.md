---
layout: post
title: "在控制台直观显示二叉树"
date: 2018-10-17 11:53:00 +0800
categories: [cnblogs]
description: "2018.10.25修改 重构部分代码，加入了打印树枝的函数，但是还不够完美！！先暂时放下 当我们学习树这种数据结构时会牵扯到很多的东西,基本上学习数据结构的一大重心都围绕着树这一个最基础的结构 但是问题来了!"
source_url: "https://www.cnblogs.com/Crel-Devi/p/9803238.html"
original_title: "二叉树的直观显示-克里尔肖"
---

重构部分代码，加入了打印树枝的函数，但是还不够完美！！先暂时放下

-------------------------------------------------------------------------------------------------------------------------------------------------------

### **当我们学习树这种数据结构时会牵扯到很多的东西,基本上学习数据结构的一大重心都围绕着树这一个最基础的结构**

### **但是问题来了!平时我们都是直接自己在脑子里或者图纸上先描述好这个树,然后我们在对控制台输入我们想要的!**

### **那么我们如何能够确定自己创建的一颗树来是正确的呢?**

#### 有很多种办法可以(这里说两种)

* 我们可以通过遍历输出我们所创建的树形结构(先序,中序,后序,层次遍历都可以)

优点：代码思路简单，很多书籍上直接给出。

缺点：需多个方式（先序+中序或先序+后序）才能判别出

* 我们希望控制台能够以一种类似于我们在图纸上的形式显现出来。

优点：直接显现，错误一看便知

缺点：代码思路较难，新手难以控制

树的各种遍历许多书籍已经给出，我的个人博客上也有一些版本，网上的版本也大都一致。这里不再叙述

下面介绍一种本人原创的一种思路：

首先这种想法需要一个另外的结构数组来保存你的树节点

假如有一棵树为下图所示：

![文章插图](/images/posts/cnblogs/1457277-20181017112745175-394160990.jpg)

由上图可知要想打印一颗比较直观的二叉树，我们最主要的就是要考虑那些理论完全二叉树上没有节点的地方如何控制输出如上图右边的（5，7，8，9，11，12，13）节点上是空的这个时候我们应该用空格

或者其他自定义的字符来表示这个空节点

下面给出代码：

DisplayTree.h:

```c
#ifndef _PRINTTREE_H
#define _PRINTTREE_H

#include "BinaryTree.h"
//按需选择自己需要打印的各种类型树；
//但只支持类似下面树结点的申明形式：
//struct TreeNode
//{
//    TreeElementType Element;
//    struct TreeNode *Left;
//    struct TreeNode *Right;
//};

typedef BinaryTree Tree; //打印其他树类型，请修改此处树类型指针

struct FlagNode
{
    ElementType Element;
    int SerialNumber;
};
typedef struct FlagNode *Flag;

void DisplayTree(Tree T);
void MarkTreeNode(Tree T, Flag Array, int f);
void PrintFlag(Flag Array, int ArraySize);
void Display(Flag Array, int ArraySize, int DepthOfTree);
void OutSpace(int n);
void OutBranch(int haveLeft, int haveRight, int level);
int AllNodes(Tree T);
int TotalDepth(Tree T);

#endif
```

DisplayTree.c:

```c
#include "DisplayTree.h"
#include <math.h>
#include <stdio.h>
#include <stdlib.h>
//这里放一组深度为5的满二叉树元素组：
// phdba00c00fe00g00lji00k00nm00o00xtrq00s00vu00w00bzy00a00dc00e00
static int count = 0;

void DisplayTree(Tree T)
{
    int allNodes = AllNodes(T);
    int depth = TotalDepth(T);
    Flag A = (Flag)malloc(sizeof(struct FlagNode) * allNodes);
    if (NULL == A)
        return;
    MarkTreeNode(T, A, 1);
    //PrintFlag(A, allNodes);
    printf("The binary tree is look like:\n");
    Display(A, allNodes, depth);
}

//给树结点做标记，按理论完全二叉树的序号标记
void MarkTreeNode(Tree T, Flag Array, int No)
{
    if (NULL != T)
    {
        Array[count].SerialNumber = No;
        Array[count++].Element = T->Element;
        MarkTreeNode(T->Left, Array, No * 2);
        MarkTreeNode(T->Right, Array, No * 2 + 1);
    }
}

void Display(Flag Array, int ArraySize, int depth)
{
    int lineStart, lineEnd;
    int spaceInFront = depth - 1;
    int interval = depth;//节点之间的间隔指数
    for (int level = 0; level < depth; level++)
    {
        /*    level:0    ___1                    */
        /*    level:1    _2___3                 */
        /*    level:2    4_5_6_7               */
        lineStart = pow(2, level);
        lineEnd = lineStart * 2;
        OutSpace(spaceInFront); //输出每行前面的空格
        for (int start = lineStart; start < lineEnd; start++)
        {
            /*eg:从4，5，6，7按顺序检测该标志是否存在，存在输出节点，不存在则输出"0"*/
            int exist = 0;
            for (int i = 0; i < ArraySize; i++)
            {
                if (start == Array[i].SerialNumber)
                {
                    printf("%c", Array[i].Element);
                    exist = 1;
                }
            }
            if (exist == 0)
                printf(" ");
            OutSpace(interval); //输出一个节点后的空格
        }
        printf("\n");
        spaceInFront--;
        interval--;
        OutSpace(spaceInFront);
        for (int parent = lineStart; parent < lineEnd; parent++)
        {
            int exist = 0;
            for (int i = 0; i < ArraySize; i++)
            {
                if (parent == Array[i].SerialNumber)
                {
                    int haveLeft = 0, haveRight = 0; //记录当前节点是否有左右孩子 0 为无
                    int leftChild = parent * 2;
                    int rightChild = parent * 2 + 1;
                    for (int last = i; last < ArraySize; last++)
                    {
                        if (Array[last].SerialNumber == leftChild)
                            haveLeft = 1;
                        if (Array[last].SerialNumber == rightChild)
                            haveRight = 1;
                    }
                    OutBranch(haveLeft, haveRight, interval);
                    OutSpace(interval);
                    exist = 1;
                }
            }
            if (!exist)
            {
                OutBranch(0, 0, interval);
                OutSpace(interval);
            }
        }
        printf("\n");

    }
}

/*可变长树枝"┌─────┴─────┐"*/
void OutBranch(int haveLeft, int haveRight, int interval)
{
    if (haveLeft)
    {
        printf("┌");
        for (int i = 0; i < pow(2, interval) / 2 - 1; i++)
            printf("─");
        if (haveRight)
        {
            /*"┌─────┴─────┐"*/
            printf("┴");
            for (int i = 0; i < pow(2, interval) / 2 - 1; i++)
                printf("─");
            printf("┐");
        }
        else
        {
            /*"┌─────┘        "*/
            printf("┘");
            for (int i = 0; i < pow(2, interval) / 2 - 1; i++)
                printf(" ");
            printf(" ");
        }
    }
    else
    {
        printf(" ");
            for (int i = 0; i < pow(2, interval) / 2 - 1; i++)
                printf(" ");
        if(haveRight)
        {
            /*"      └──────┐"*/
            printf("└");
            for (int i = 0; i < pow(2, interval) / 2 - 1; i++)
                printf("─");
            printf("┐");
        }
        else
        {
            /*"              "*/
            printf(" ");
            for (int i = 0; i < pow(2, interval) / 2 - 1; i++)
                printf(" ");
            printf(" ");
        }
    }
}

void OutSpace(int n)
{
    for (int i = 0; i < pow(2, n); i++)
        printf(" ");
    printf("\b");
}
//辅助debug函数
void PrintFlag(Flag Array, int ArraySize)
{
    for (int i = 0; i < ArraySize; i++)
        printf("%c-->%d\n", Array[i].Element, Array[i].SerialNumber);
}
int TotalDepth(Tree T) //输出的是整个二叉树的深度
{
    int DepthOfLeft = 0;
    int DepthOfRight = 0;
    if (NULL == T)
        return 0;
    else
    {
        DepthOfLeft = TotalDepth(T->Left);
        DepthOfRight = TotalDepth(T->Right);
        return (DepthOfLeft > DepthOfRight) ? DepthOfLeft + 1 : DepthOfRight + 1;
    }
}
int AllNodes(Tree T)
{
    if (NULL == T)
        return 0;
    else if (T->Left == NULL && T->Right == NULL)
        return 1;
    else
        return AllNodes(T->Left) + AllNodes(T->Right) + 1; //加1等于是每次返回 加一个根结点
}
```

下面是我的一组简单测试：(注意此处我创建的树元素是我已经写好了CreateTree()直接用的，具体看你自己用的树操作）

test.c:

```c
#include"DisplayTree.h"
#include"BinaryTree.h"
#include<stdio.h>
#include<stdlib.h>

int main()
{
    BinTree BT;
    BT = CreateTree();
    DisplayTree(BT);
    return 0;
}
```

输出图样：

![文章插图](/images/posts/cnblogs/1457277-20181025215527997-1058486917.png)
