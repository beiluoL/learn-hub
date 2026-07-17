---
title: 集合框架 · 系统学习路线
category: java
module: java-collection
subcat: roadmap
timeline: true
level: medium
tier: key
readMinutes: 12
tags: "集合框架, 学习路线, 路线图"
summary: 从总览到逐章拆解的 集合框架 学习路线，点开任意章节开始学习。
order: 0
---

这份路线把「集合框架」拆成 6 个阶段，每个阶段给出**核心任务**与**练手目标**。建议边看边敲，每完成一项就勾掉一项。

## 0. 集合体系概览

掌握 Collection 与 Map 两大分支及泛型。

- [ ] 分清 List/Set/Queue/Map
- [ ] 会用泛型
- [ ] 理解迭代方式

## 1. List 体系

ArrayList 与 LinkedList 的底层与选型。

- [ ] 说清 ArrayList vs LinkedList
- [ ] 理解扩容机制
- [ ] 会用遍历

## 2. Set 体系

HashSet/TreeSet/LinkedHashSet 与去重原理。

- [ ] 理解 HashSet 去重原理
- [ ] 会重写 hashCode/equals
- [ ] 区分三种 Set

## 3. Map 体系

HashMap 原理、红黑树与 ConcurrentHashMap。

- [ ] 讲清 HashMap put 流程
- [ ] 理解树化阈值
- [ ] 会遍历 Map

## 4. Queue 与栈

Deque、PriorityQueue 与 ArrayDeque 的使用。

- [ ] 会用 Queue/Deque
- [ ] 理解优先队列
- [ ] 用 ArrayDeque 当栈

## 5. 工具类与源码

Collections/Arrays 工具与迭代器 fail-fast。

- [ ] 掌握 Collections/Arrays
- [ ] 理解 fail-fast
- [ ] 读过核心源码

## 资源与节奏

- 官方文档与权威资料优先；
- 节奏：每天 1~2 小时，理论 + 敲代码交替；
- 关键：每个模块至少完成 1 个可运行的小项目，代码放仓库。
