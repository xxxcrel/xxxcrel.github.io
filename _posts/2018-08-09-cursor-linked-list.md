---
layout: post
title: "链表的游标实现"
date: 2018-08-09 10:24:00 +0800
categories: [cnblogs]
description: "前言： 最开始读M.A.W这本书时，已经简单了解了一些基本数据结构，于是刚开始读时总会有点囫囵吞枣的感觉，并没有认真研究链表的游标实现过程， 简单看了下书中代码就过了，现在从新翻阅，反而是让自己收获颇丰。"
source_url: "https://www.cnblogs.com/Crel-Devi/p/9447339.html"
original_title: "链表的游标实现-克里尔肖"
---
**前言：**

**最开始读M.A.W这本书时，已经简单了解了一些基本数据结构，于是刚开始读时总会有点囫囵吞枣的感觉，并没有认真研究链表的游标实现过程，**

**简单看了下书中代码就过了，现在从新翻阅，反而是让自己收获颇丰。**

**————————————————分割线——————————————————————**

**正文：**

**为什么我们会用到链表的游标实现，链表的核心用到了指针这样的概念，而许多语言是没有指针的，这个时候想要实现链表我们就要想其他办法了**

**那么我们应该从何开始呢？**

**回顾链表的指针实现的两个重要的特点：**

**1：数据储存在一组结构体中，每一个结构体包含有数据域以及指向下一个结构体的指针。**

**2：一个新的结构体可以通过调用malloc而从系统全局内存（global memory)得到，并可以调用free而被释放。**

**游标法必须能够模仿实现这两种特性，需要满足条件1的逻辑方法是要有一个全局的结构体数组。对于该数组中的任何单元，其数组线标用来代表一个地址。**

**初始配置如下：**

一个初始化的CursorSpace

|  |  |  |
| --- | --- | --- |
| Slot | Element | Next |
| 0 |  | 1 |
| 1 |  | 2 |
| 2 |  | 3 |
| 3 |  | 4 |
| 4 |  | 5 |
| 5 |  | 6 |
| 6 |  | 7 |
| 7 |  | 8 |
| 8 |  | 9 |
| 9 |  | 10 |
| 10 |  | 0 |

**为了模拟特性2，让CursorSpace数组中的单元代行malloc和free的职能，**

**为此我们保留一个表（即freelist），该表将用单元0作为表头。**

**下面给出链表游标实现的声明：**

**Cursor.h：**

```c
#ifndef CURSOR_SPACE_H
#define CURSOR_SPACE_H

typedef char ElementType;

typedef int PtrToNode;
typedef PtrToNode Position;
typedef PtrToNode List;

void InitializeCursorSpace();
static Position CursorAlloc();
static void CursorFree(Position P);

List MakeEmpty(List L);
int IsLast(Position P, List L);
int IsEmpty(List L);
Position FindPrevious(List L, ElementType x);
Position Find(List L, ElementType x);
void Delete(List L, ElementType x);
void Insert(List L, ElementType x, Position P);
void InsertToTail(List L, ElementType x);
void InsertToHead(List L, ElementType x);
void PrintList(List L);
void DeleteList(List L);

#endif
```

**需要实现整个例程主要是CursorAlloc()和CursorFree()这两个函数起关键作用：**

```c
/*每次CursorAlloc都从CursorSpace的单元0下一个开始Alloc8*/static Position CursorAlloc()
{
    Position P;
    P = CursorSpace[0].Next;
    CursorSpace[0].Next = CursorSpace[P].Next;
    return P;
}
/*当我们需要free时将把free的单元放在单元0的下一位*/
static void CursorFree(Position P)
{
    CursorSpace[P].Next = CursorSpace[0].Next;
    CursorSpace[0].Next = P;
}
```

**下面给出声明中的所有完整例程实现代码,除CursorAlloc()和CursorFree()其余函数实现方法和单链表思想一致；**

**CursorSpace.c:**

```c
#include"Cursor.h"
#include<stdio.h>

#define SpaceSize 20

struct Node
{
    ElementType Element;
    Position Next;
};

struct Node CursorSpace[SpaceSize + 1];//定义一个全局CursorSpace空间

void InitializeCursorSpace()
{
    int Slot;
    for(Slot = 0; Slot < SpaceSize + 1; Slot++)
    {
        if(Slot != SpaceSize)
            CursorSpace[Slot].Next = Slot + 1;
        else
           CursorSpace[Slot].Next = 0;
    }
}

static Position CursorAlloc()
{
    Position P;
    P = CursorSpace[0].Next;
    CursorSpace[0].Next = CursorSpace[P].Next;
    return P;
}

static void CursorFree(Position P)
{
    CursorSpace[P].Next = CursorSpace[0].Next;
    CursorSpace[0].Next = P;
}

List MakeEmpty(List L)
{
    if(L != 0)
        CursorSpace[L].Next = 0;
    return L;
}
int IsLast(Position P, List L)
{
    return CursorSpace[P].Next == 0;
}

int IsEmpty(List L)
{
    return CursorSpace[L].Next == 0;
}

Position FindPrevious(List L, ElementType X)
{
    Position P;
    P = L;
    while(CursorSpace[P].Next && CursorSpace[CursorSpace[P].Next].Element != X)
        P = CursorSpace[P].Next;
    return P;
}

Position Find(List L, ElementType X)
{
    Position P;
    P = CursorSpace[L].Next;
    while(P && CursorSpace[P].Element != X)
        P = CursorSpace[P].Next;
    return P;
}

void Delete(List L, ElementType X)
{
    Position Pre, Tmp;
    Pre = FindPrevious(L, X);
    if(Pre == 0)
        printf("Sorry! Can't find element");
    else
    {
        Tmp = CursorSpace[Pre].Next;
        CursorSpace[Pre].Next = CursorSpace[Tmp].Next;
        CursorFree(Tmp);
    }
}

void Insert(List L, ElementType X, Position P)
{
    Position NewCell;
    NewCell = CursorAlloc();
    if(NewCell == 0)
        printf("No space for allocation!!");
    else
    {
        CursorSpace[NewCell].Element = X;
        CursorSpace[NewCell].Next = CursorSpace[P].Next;
        CursorSpace[P].Next = NewCell;
    }
}

void InsertToTail(List L, ElementType X)
{
    Position Last;
    Last = L;
    /*遍历链表寻找最后一个结点*/
    while(CursorSpace[Last].Next != 0)
        Last = CursorSpace[Last].Next;
    Insert(L, X, Last);
}

void InsertToHead(List L, ElementType X)
{
    Insert(L, X, L);
}

void DeleteList(List L)
{
    Position P, Tmp;
    P = CursorSpace[L].Next;
    CursorSpace[L].Next = 0;
    while(P != 0)
    {
        Tmp = CursorSpace[P].Next;
        CursorFree(P);
        P = Tmp;
    }
}

void PrintList(List L)
{
    Position P;
    P = CursorSpace[L].Next;
    while(CursorSpace[P].Next != 0)
    {
        printf("%c-", CursorSpace[P].Element);
        P = CursorSpace[P].Next;
    }
    printf("%c\n", CursorSpace[P].Element);
}
```

**最后给出自己的一组测试实例**

**Test.c:**

```c
#include"Cursor.h"
#include<stdio.h>


int main()
{
    InitializeCursorSpace();
    ElementType Elem, De, PreElem, Ins;
    Position Tmp;
    List L;
    L = CursorAlloc();
    if(L == 0)
        printf("No space for Allocation");
    L = MakeEmpty(L);
    printf("请输入链表元素以'#'结束：");
    while((Elem = getchar()) != '#')
    {
        InsertToTail(L, Elem);
    }
    getchar();
    PrintList(L);
    
    printf("请输入你要删除的元素：");
    scanf("%c", &De);
    getchar();
    Delete(L, De);
    PrintList(L);
    
    printf("请输入你将要插在哪个元素后：");
    scanf("%c", &PreElem);
    getchar();
    Tmp = Find(L, PreElem);
    
    printf("请输入你要插入的元素：");
    scanf("%c", &Ins);
    Insert(L, Ins, Tmp);
    PrintList(L);    /*最后删除整个表以及表头*/    DeleteList(L);    CursorFree(L);
    
    return 0;
}
```

![文章插图](/images/posts/cnblogs/1457277-20180809102344491-29564327.png)
