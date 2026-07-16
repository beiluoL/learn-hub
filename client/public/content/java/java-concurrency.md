---
title: 并发编程：线程、线程池与并发容器
category: java
level: advanced
readMinutes: 20
tags: "并发, 线程池, 锁, JUC"
summary: 理解线程模型、线程池参数与常见并发工具，写出安全的多线程代码。
order: 4
---

## 一、创建线程的三种方式

```
// 1. 继承 Thread
// 2. 实现 Runnable
Runnable r = () -> System.out.println("run");
new Thread(r).start();

// 3. 实现 Callable（有返回值 + 抛异常）
Callable<Integer> c = () -> 42;
Future<Integer> f = executor.submit(c);
```

## 二、线程池（ThreadPoolExecutor）

核心参数决定行为：

-   **corePoolSize**：核心线程数，常驻
-   **maximumPoolSize**：最大线程数
-   **keepAliveTime**：非核心线程空闲存活时间
-   **workQueue**：任务队列（ArrayBlockingQueue / LinkedBlockingQueue / SynchronousQueue）
-   **handler**：拒绝策略（AbortPolicy / CallerRunsPolicy / DiscardPolicy）

```
ExecutorService pool = new ThreadPoolExecutor(
  4, 8, 60, TimeUnit.SECONDS,
  new LinkedBlockingQueue<>(1000),
  new ThreadPoolExecutor.CallerRunsPolicy());
```

不要直接用 `Executors.newFixedThreadPool` 等——其无界队列可能堆积导致 OOM，建议手动构造并明确队列容量。

## 三、常用并发工具（JUC）

-   `synchronized`：JVM 内置锁，可重入，1.6 后做了锁升级（偏向→轻量→重量）
-   `ReentrantLock`：可中断、公平锁、多条件变量
-   `volatile`：保证可见性 + 禁止重排序，不保证原子性
-   `CountDownLatch / CyclicBarrier / Semaphore`：线程协作
-   `ConcurrentHashMap / CopyOnWriteArrayList`：并发容器

口诀：计数用原子类（`AtomicInteger`），复合操作用锁或 `LongAdder`。
