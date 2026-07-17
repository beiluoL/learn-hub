---
title: Java 内存模型与原子类
category: interview
module: iv-java
subcat: roadmap
timeline: false
level: hard
tier: extra
readMinutes: 12
tags: "Java 面试, JMM, 原子类"
summary: "JMM、happens-before 与原子操作"
order: 7
---

- JMM 抽象：主内存与线程工作内存
- happens-before 规则保证可见性与有序性
- 原子类 AtomicInteger 基于 CAS 自旋
- ABA 问题及 AtomicStampedReference 解决

```java
AtomicInteger count = new AtomicInteger(0);
count.incrementAndGet();      // 原子自增
boolean ok = count.compareAndSet(1, 2); // CAS
```

> CAS 自旋在竞争激烈时可能带来额外开销。

**自查清单**
- [ ] 能说 happens-before
- [ ] 能解释 ABA
