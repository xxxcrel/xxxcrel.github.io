---
layout: post
title: "单链表 ADT 与 C 语言实现"
date: 2018-08-07 18:25:00 +0800
categories: [cnblogs]
description: "本博客第一篇学术性博客，所以还是写点什么东西； 首先这篇博客以及以后的博客中的代码尽量百分之90是自己写过的； 可能有部分图片和代码是我认为别人更好的故摘抄下来， 本人三观正确，所以一定会表明来源；"
source_url: "https://www.cnblogs.com/Crel-Devi/p/9438662.html"
original_title: "单链表ADT-克里尔肖"
---
**本博客第一篇学术性博客，所以还是写点什么东西；**

**首先这篇博客以及以后的博客中的代码尽量百分之90是自己写过的；**

**可能有部分图片和代码是我认为别人更好的故摘抄下来，**

**本人三观正确，所以一定会表明来源；**

—————————华丽的分割线——————————————

参考书籍——《[数据结构于算法分析(C语言描述)](https://book.douban.com/subject/1139426/ "数据结构于算法分析")》

链表是最基本的数据结构之一，当我们学习完C语言后就会涉及到一点点链表的知识；

本篇博客主要记录链表的一些简单思路以及它的一些主要例程；

按照c的约定我们先将链表的函数原型以及一些typedef定义都放在一个Lish.h头文件里

List.h:

```c
#ifndef LIST_H
#define LIST_H

typedef char ElementType;

struct Node;
typedef struct Node *PtrToNode;
typedef PtrToNode Position;
typedef PtrToNode List;

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
void Reverse(List L);

#endif
```

**本篇中的代码所建立的链表都是带有头节点的链表，而使用表头属于个人习惯，我们不再这里做深究**

**下面的函数尽量满足ADT的想法，没有写CreateList函数是因为该函数功能是对一个已经创建好了的链表的操作而不是一个纯练习的文件，这是个人对此的理解如有更好的解释请大方私信我！谢谢!**

**添加了两个Insert函数分别是InsertToTail和InsertToHead，从字面上来看就是尾插法和头插法，考虑到M.A.W的Insert例程需要传入位置P，而此举往往很麻烦，于是加上了一个直接插入到尾部和头部的函数**

**使整个ADT的想法更加完善。**

**操作图示：**

**![文章插图](/images/posts/cnblogs/1457277-20180906223040749-65744079.jpg)**

这里主要将链表的一些主要例程写出来，并将这些函数封装在一个.c文件里增强复用性！

 SingleLinkedList.c:

```c
#include"List.h"
#include<stdio.h>
#include<stdlib.h>

struct Node{
    ElementType Element;
    PtrToNode Next;
};

List MakeEmpty(List L)
{
    if(NULL != L)
    {
        L->Next = NULL;
    }
    return L;
}

int IsLast(Position P, List L)//L is unused
{
    return P->Next == NULL;
}

int IsEmpty(List L)
{
    return L->Next == NULL;
}

Position FindPrevious(List L, ElementType x)
{
    Position P;
    P = L;
    while(P->Next && P->Next->Element != x)
        P = P->Next;
    return P;
}

Position Find(List L, ElementType x)
{
    Position P;
    P = L->Next;
    while(P && P->Element != x)
        P = P->Next;
    return P;
}

 void Delete(List L, ElementType x)
{
    Position Pre, Tmpcell;
    
    Pre = FindPrevious(L, x);//we need find the previous of deleted element
    if(!IsLast(Pre, L))
    {
        Tmpcell = Pre->Next;
        Pre->Next = Tmpcell->Next;
        free(Tmpcell);
    }
}

//we insert the element after the position p
void Insert(List L, ElementType x, Position P)
{
    Position NewCell;
    TmpCell = (List)malloc(sizeof(struct Node));
    if(NULL == NewCell)
        printf("No space for allocation!!");
    else
    {
        NewCell->Element = x;
        NewCell->Next = P->Next;
        P->Next = NewCell;
    }
}
//插入链表尾部(尾插法)
void InsertToTail(List L, ElementType x)
{
    Position Last, NewCell;
    Last = L;
    /*遍历链表找到最后一个结点*/
    while(NULL != Last->Next)
        Last = Last->Next;
    Insert(L, x, Last);
}
//插入链表头部(头插法)
void InsertToHead(List L, ElementType x)
{
    Insert(L, x, L);
}

void PrintList(List L)
{
    PtrToNode Tmp;
    Tmp = L->Next;
    while(Tmp->Next)
    {
        printf("%c-", Tmp->Element);
        Tmp = Tmp->Next;
    }
    printf("%c\n", Tmp->Element);
}

void DeleteList(List L)
{
    Position Tmp, P;
    P = L->Next;
    L->Next = NULL;
    while(P != NULL)
    {
        Tmp = P->Next;
        free(P);
        P = Tmp;
    }
    free(L);
}

void Reverse(List L)
{
    Position CurrentPos, NextPos, PreviousPos;
    
    CurrentPos = L->Next;//当前单链表的第一个节点
    PreviousPos = NULL;//指向新链表的第一个节点，假设开始为空
    while(CurrentPos != NULL)
    {
        NextPos = CurrentPos->Next;//取得当前节点的下一个节点位置
        CurrentPos->Next = PreviousPos;//当前节点连接成新的链表
        PreviousPos = CurrentPos;
        CurrentPos = NextPos;//遍历到下一个节点
    }
    L->Next = PreviousPos;//哑元节点连接新链表的头节点
}
//与上述思想差不多，主要在返回上
/*Asumming(假如）is no header and L is not empty*/
//List Reverse(List L)
//{
//    Position CurrentPos, NextPos, PreviousPos;
//    
//    CurrentPos = L;
//    PreviousPos = NULL;
//    while(CurrentPos != NULL)
//    {
//        NextPos = CurrentPos->Next;
//        CurrentPos->Next = PreviousPos;
//        PreviousPos = CurrentPos;
//        CurrentPos = NextPos;
//    }
//    return PreviousPos;
//}
//下面是复杂记忆写法
//void Reverse(List L)//含有头节点
//{
//    Position Tmp, P;
//    Tmp = L->Next;
//    L->Next = NULL;
//    while(Tmp != NULL)
//    {
//        P = Tmp->Next;
//        Tmp->Next = L->Next;
//        L->Next = Tmp;
//        Tmp = P;
//    }
//}
//List Reverse(List L)//不含头节点
//{
//    PtrToNode Tmp, P;
//    P = L;
//    L = NULL;
//    while(P != NULL){
//        Tmp = P->Next;
//        P->Next = L;
//        L = P;
//        P = Tmp;
//    }
//    return L;
//}
```

下面贴出自己写的一组测试代码

Test.c:

```c
#include"List.h"
#include<stdio.h>
#include<stdlib.h>

int main()
{
    ElementType Elem, De, PreElem, Ins;
    Position Tmp;
    List L;
    L = (List)malloc(sizeof(struct Node));
    if(NULL == L)
        printf("Allocation failure!!!");
    L = MakeEmpty(L);
    printf("Please enter the element until the end of '#':");
    while((Elem = getchar()) != '#')
    {
        InsertToTail(L, Elem);
    }
    getchar();
    PrintList(L);
    //删除并输出
    printf("Please enter the element you want to delete:");
    scanf("%c", &De);
    getchar();
    
    Delete(L, De);
    PrintList(L);
    //插入并输出
    printf("After which element do you want to insert:");
    scanf("%c", &PreElem);
    getchar();
    Tmp = Find(L, PreElem);
    
    printf("What element do you want to insert:");
    scanf("%c", &Ins);
    getchar();
    
    Insert(L, Ins, Tmp);
    PrintList(L);
    //将整个表倒置
    Reverse(L);
    printf("Now the reverse list is:");
    PrintList(L);
    //删除整个表
    DeleteList(L);
    return 0;
}
```

![文章插图](/images/posts/cnblogs/1457277-20180807182447932-1131348821.png)
