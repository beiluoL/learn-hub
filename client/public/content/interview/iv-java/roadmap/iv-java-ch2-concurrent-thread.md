---
title: 并发与线程池
category: interview
module: iv-java
subcat: roadmap
timeline: false
level: hard
tier: key
readMinutes: 13
tags: "Java 面试, 并发, 线程池"
summary: 线程状态、线程池参数与拒绝策略
order: 3
---

- 六种状态：NEW/RUNNABLE/BLOCKED/WAITING/TIMED_WAITING/TERMINATED
- ThreadPoolExecutor 七大参数（核心/最大线程、队列、拒绝策略等）
- 拒绝策略：AbortPolicy/DiscardPolicy/DiscardOldestPolicy/CallerRunsPolicy
- Executors 固定/缓存线程池的隐患（OOM/资源耗尽）

```java
ExecutorService pool = new ThreadPoolExecutor(
    2, 4, 60L, TimeUnit.SECONDS,
    new LinkedBlockingQueue<>(100),
    Executors.defaultThreadFactory(),
    new ThreadPoolExecutor.CallerRunsPolicy());
```

> 生产推荐手动创建线程池，避免使用 Executors 快捷方法。

**自查清单**
- [ ] 能解释每个参数含义
- [ ] 能说出拒绝策略适用场景
