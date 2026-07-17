---
title: 同步与锁
category: java
module: java-juc
subcat: roadmap
timeline: false
level: medium
tier: core
readMinutes: 12
tags: 并发编程
summary: synchronized 原理与死锁防范。
order: 2
---

- `synchronized` 保证同一时刻只有一个线程进入临界区。
- 可修饰方法或代码块，锁对象为 this / 类 / 指定对象。
- 底层基于对象监视器（monitor）。
- 死锁：互相持有对方所需锁，需破坏四个必要条件之一。
- 尽量缩小同步范围，降低争用。

**自查清单**
- [ ] 理解 synchronized
- [ ] 能定位死锁
- [ ] 缩小同步范围
