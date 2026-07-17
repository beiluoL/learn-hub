---
title: 线程池
category: java
module: java-juc
subcat: roadmap
timeline: false
level: hard
tier: key
readMinutes: 12
tags: 并发编程
summary: ThreadPoolExecutor 原理与参数配置。
order: 5
---

- `Executors` 快捷工厂（注意 OOM 风险，推荐手动创建）。
- 核心参数：核心/最大线程数、队列、拒绝策略、空闲回收。
- 任务提交：`execute`（无返回）/ `submit`（有 Future）。
- 拒绝策略：Abort/CallerRuns/Discard 等。
- 合理配置：CPU 密集≈核数，IO 密集可更大。

```java
ThreadPoolExecutor pool = new ThreadPoolExecutor(
  4, 8, 60, TimeUnit.SECONDS, new LinkedBlockingQueue<>(100));
```

**自查清单**
- [ ] 能手写线程池
- [ ] 理解拒绝策略
- [ ] 合理设置参数
