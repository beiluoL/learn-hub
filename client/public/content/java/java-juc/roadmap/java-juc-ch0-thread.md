---
title: 线程基础
category: java
module: java-juc
subcat: roadmap
timeline: false
level: medium
tier: basic
readMinutes: 12
tags: 并发编程
summary: Thread/Runnable、线程状态与守护线程。
order: 1
---

- 创建线程：`extends Thread` 或 `implements Runnable`（推荐后者）。
- 线程状态：新建/就绪/运行/阻塞/终止。
- `start()` 启动（非 run），`join()` 等待结束。
- 守护线程（daemon）不阻止 JVM 退出。
- 线程优先级仅作提示，不保证执行顺序。

```java
Thread t = new Thread(() -> System.out.println("run"));
t.start(); t.join();
```

**自查清单**
- [ ] 两种创建线程方式
- [ ] 理解线程状态
- [ ] 会用 join
