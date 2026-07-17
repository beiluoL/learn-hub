---
title: 高并发计数器
category: java
module: java-juc
subcat: cases
timeline: false
level: hard
tier: key
readMinutes: 20
tags: "并发编程, 项目案例"
summary: 用线程池 + 原子类实现一个线程安全的百万级计数器。
order: 1
---

- 多个线程并发累加 `AtomicLong`。
- 用线程池提交任务，join 等待。
- 对比 `i++`（非原子，错误）与原子方案。
- 输出最终计数验证正确性。

```java
AtomicLong cnt = new AtomicLong();
IntStream.range(0, 100).forEach(i -> pool.execute(() -> cnt.incrementAndGet()));
```

**自查清单**
- [ ] 线程安全计数
- [ ] 用线程池
- [ ] 验证结果正确
