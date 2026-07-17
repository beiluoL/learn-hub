---
title: Java 面试 · 系统学习路线
category: interview
module: iv-java
subcat: roadmap
timeline: true
level: hard
tier: key
readMinutes: 12
tags: "Java 面试, 学习路线, 路线图"
summary: 从总览到逐章拆解的 Java 面试 学习路线，点开任意章节开始学习。
order: 0
---

这份路线把「Java 面试」拆成 7 个阶段，每个阶段给出**核心任务**与**练手目标**。建议边看边敲，每完成一项就勾掉一项。

## 0. JVM 垃圾回收

分代回收、GC 算法与常见收集器原理

- [ ] 能说出 GC Roots 包含哪些
- [ ] 能对比 CMS 与 G1 差异

## 1. JVM 内存模型

运行时数据区与对象创建的内存流转

- [ ] 能画出运行时数据区
- [ ] 能解释 OOM 的常见区域

## 2. 并发与线程池

线程状态、线程池参数与拒绝策略

- [ ] 能解释每个参数含义
- [ ] 能说出拒绝策略适用场景

## 3. 并发锁与 JUC

synchronized、ReentrantLock 与 AQS

- [ ] 能讲锁升级过程
- [ ] 能说 AQS 工作原理

## 4. 集合框架

HashMap、ConcurrentHashMap 与常见集合

- [ ] 能说 HashMap 扩容机制
- [ ] 能说 1.7 与 1.8 差异

## 5. Spring Bean 与 IoC

Bean 生命周期、作用域与循环依赖

- [ ] 能说生命周期回调
- [ ] 能解释三级缓存

## 6. Java 内存模型与原子类

JMM、happens-before 与原子操作

- [ ] 能说 happens-before
- [ ] 能解释 ABA

## 资源与节奏

- 官方文档与权威资料优先；
- 节奏：每天 1~2 小时，理论 + 敲代码交替；
- 关键：每个模块至少完成 1 个可运行的小项目，代码放仓库。
