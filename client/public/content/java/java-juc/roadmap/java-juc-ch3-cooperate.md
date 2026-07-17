---
title: 线程协作
category: java
module: java-juc
subcat: roadmap
timeline: false
level: hard
tier: key
readMinutes: 12
tags: 并发编程
summary: wait/notify 与 CountDownLatch 等同步工具。
order: 4
---

- `wait/notify/notifyAll` 需在 synchronized 内调用。
- `CountDownLatch`：等待 N 个任务完成。
- `CyclicBarrier`：多线程到达屏障再继续。
- `Semaphore`：控制并发许可数。
- 优先用高级同步器，少用 wait/notify。

**自查清单**
- [ ] 理解等待/唤醒
- [ ] 会用 Latch/Barrier
- [ ] 会用 Semaphore
