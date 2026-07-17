---
title: 并发编程 · 系统学习路线
category: java
module: java-juc
subcat: roadmap
timeline: true
level: hard
tier: key
readMinutes: 12
tags: "并发编程, 学习路线, 路线图"
summary: 从总览到逐章拆解的 并发编程 学习路线，点开任意章节开始学习。
order: 0
---

这份路线把「并发编程」拆成 6 个阶段，每个阶段给出**核心任务**与**练手目标**。建议边看边敲，每完成一项就勾掉一项。

## 0. 线程基础

Thread/Runnable、线程状态与守护线程。

- [ ] 两种创建线程方式
- [ ] 理解线程状态
- [ ] 会用 join

## 1. 同步与锁

synchronized 原理与死锁防范。

- [ ] 理解 synchronized
- [ ] 能定位死锁
- [ ] 缩小同步范围

## 2. Lock 显式锁

ReentrantLock、读写锁与 Condition。

- [ ] 会用 ReentrantLock
- [ ] 理解读写锁
- [ ] 正确使用 Condition

## 3. 线程协作

wait/notify 与 CountDownLatch 等同步工具。

- [ ] 理解等待/唤醒
- [ ] 会用 Latch/Barrier
- [ ] 会用 Semaphore

## 4. 线程池

ThreadPoolExecutor 原理与参数配置。

- [ ] 能手写线程池
- [ ] 理解拒绝策略
- [ ] 合理设置参数

## 5. 并发容器与原子类

ConcurrentHashMap、原子类与 CAS。

- [ ] 会用并发容器
- [ ] 理解原子类/CAS
- [ ] 理解 volatile

## 资源与节奏

- 官方文档与权威资料优先；
- 节奏：每天 1~2 小时，理论 + 敲代码交替；
- 关键：每个模块至少完成 1 个可运行的小项目，代码放仓库。
