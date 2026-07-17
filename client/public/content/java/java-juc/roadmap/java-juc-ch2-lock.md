---
title: Lock 显式锁
category: java
module: java-juc
subcat: roadmap
timeline: false
level: hard
tier: key
readMinutes: 12
tags: 并发编程
summary: ReentrantLock、读写锁与 Condition。
order: 3
---

- `ReentrantLock` 可中断、可超时、可公平。
- 必须在 `finally` 中 `unlock()`。
- `ReadWriteLock`：读共享、写独占，提升读多场景性能。
- `Condition` 实现精细化等待/唤醒（替代 wait/notify）。
- Lock 比 synchronized 更灵活但更易出错。

```java
Lock lock = new ReentrantLock();
lock.lock();
try { /* 临界区 */ } finally { lock.unlock(); }
```

**自查清单**
- [ ] 会用 ReentrantLock
- [ ] 理解读写锁
- [ ] 正确使用 Condition
