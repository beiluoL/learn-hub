---
title: 并发锁与 JUC
category: interview
module: iv-java
subcat: roadmap
timeline: false
level: hard
tier: key
readMinutes: 14
tags: "Java 面试, 并发, JUC, 锁"
summary: synchronized、ReentrantLock 与 AQS
order: 4
---

- synchronized 锁升级：无锁→偏向锁→轻量级锁→重量级锁
- ReentrantLock 支持可中断、公平锁、多条件 Condition
- AQS：基于 state + CLH 队列实现独占/共享同步
- volatile 保证可见性与有序性（禁止指令重排）

```java
ReentrantLock lock = new ReentrantLock();
lock.lock();
try {
    // 临界区
} finally {
    lock.unlock(); // 必须在 finally 释放
}
```

> AQS 是 ReentrantLock/Semaphore/CountDownLatch 的基础。

**自查清单**
- [ ] 能讲锁升级过程
- [ ] 能说 AQS 工作原理
