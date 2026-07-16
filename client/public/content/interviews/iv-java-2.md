---
question: Java 中 synchronized 和 ReentrantLock 的区别？锁升级过程是怎样的？
category: java
difficulty: hard
tags: "并发, 锁, JVM"
order: 2
---

**synchronized：**JVM 内置，自动加解锁，可重入；1.6 后做了锁升级优化。

**ReentrantLock：**API 层面锁，需手动 unlock（放在 finally），支持可中断、公平锁、多条件 Condition。

**锁升级（synchronized）：**无锁 → 偏向锁（同一线程重复进入）→ 轻量级锁（CAS 自旋）→ 重量级锁（操作系统互斥，线程阻塞）。升级后不可降级。
