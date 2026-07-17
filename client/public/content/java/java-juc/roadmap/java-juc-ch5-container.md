---
title: 并发容器与原子类
category: java
module: java-juc
subcat: roadmap
timeline: false
level: hard
tier: key
readMinutes: 12
tags: 并发编程
summary: ConcurrentHashMap、原子类与 CAS。
order: 6
---

- `ConcurrentHashMap`：分段/桶锁，高并发安全。
- `CopyOnWriteArrayList`：读多写少场景。
- 原子类 `AtomicInteger` 等基于 CAS，无锁高效。
- CAS：比较并交换，存在 ABA 问题（可用版本号解决）。
- `volatile` 保证可见性但不保证原子性。

**自查清单**
- [ ] 会用并发容器
- [ ] 理解原子类/CAS
- [ ] 理解 volatile
