---
title: 线程池深度实战：ThreadPoolExecutor 参数、拒绝策略与调优
category: java
level: advanced
readMinutes: 22
order: 25
tags: "线程池, 拒绝策略, Executors, 调优"
summary: 拆解 ThreadPoolExecutor 七大参数、四种拒绝策略与 Executors 的隐患。
prereq: java/java-concurrency
---

## 一、为什么要用线程池

线程的创建与销毁需要操作系统内核参与，开销不小；无节制地 `new Thread()` 会导致线程数爆炸、上下文切换频繁、内存耗尽。线程池通过**复用线程**、**控制并发上限**、**提供任务队列与拒绝策略**，把资源管理变得可控。

`ThreadPoolExecutor` 是 Java 线程池的核心实现，理解它的七大参数是用好线程池的前提。

## 二、七大构造参数

```java
public ThreadPoolExecutor(
    int corePoolSize,               // 核心线程数
    int maximumPoolSize,            // 最大线程数
    long keepAliveTime,             // 空闲非核心线程存活时间
    TimeUnit unit,                  // 时间单位
    BlockingQueue<Runnable> workQueue, // 任务队列
    ThreadFactory threadFactory,    // 线程工厂
    RejectedExecutionHandler handler)   // 拒绝策略
```

**corePoolSize（核心线程数）**：池中长期保有的线程数，即使空闲也不会回收（除非开启 `allowCoreThreadTimeOut`）。

**maximumPoolSize（最大线程数）**：池允许创建的最大线程总数。当队列满了且核心线程都忙，才会创建非核心线程直到达到该值。

**keepAliveTime + unit**：非核心线程空闲超过该时间就被回收，释放资源。

**workQueue（任务队列）**：核心线程忙时，新任务先入队等待。常见有界队列如 `ArrayBlockingQueue`、无界如 `LinkedBlockingQueue`、直接交接 `SynchronousQueue`。

**threadFactory（线程工厂）**：用于创建线程，可统一命名、设优先级、标记为守护线程，便于排查问题。

**handler（拒绝策略）**：队列满且线程数达最大后，再提交任务就触发拒绝。

**allowCoreThreadTimeOut**：设为 true 时，连核心线程空闲超时被回收，进一步省资源（按需谨慎使用）。

## 三、任务提交后的完整流程

向线程池提交任务的顺序是固定且关键的：

1. 线程数 < 核心线程数：直接新建核心线程执行。
2. 核心线程已满：任务放入 `workQueue` 排队。
3. 队列已满：若线程数 < maximumPoolSize，新建非核心线程执行。
4. 线程数已达最大且队列满：触发**拒绝策略**。

```java
// 直观理解（伪流程）
if (当前线程数 < corePoolSize)        新建核心线程;
else if (workQueue.offer(task))       入队;
else if (当前线程数 < maximumPoolSize) 新建非核心线程;
else                                   handler.rejectedExecution(task, this);
```

**关键陷阱**：如果使用**无界队列**（如默认 `LinkedBlockingQueue`），队列永远不会满，第 3、4 步永远不会触发，maximumPoolSize 形同虚设，任务会无限堆积。

## 四、四种拒绝策略

| 策略 | 行为 | 适用 |
| --- | --- | --- |
| `AbortPolicy`（默认） | 抛 `RejectedExecutionException` | 需要明确感知过载 |
| `DiscardPolicy` | 静默丢弃新任务 | 允许丢任务（如日志） |
| `DiscardOldestPolicy` | 丢弃队列最旧任务，重试提交 | 追求最新数据 |
| `CallerRunsPolicy` | 由提交任务的线程自己执行 | 平缓降级、限流反压 |

`CallerRunsPolicy` 很有用：当线程池饱和，由调用方线程（如 Tomcat 的 IO 线程）亲自执行任务，既不直接丢任务，又因调用方被占住而自然降低提交速率，起到“反压”作用。

## 五、为什么禁止用 Executors 快捷方法

`Executors.newFixedThreadPool` 和 `newSingleThreadExecutor` 用的是**无界** `LinkedBlockingQueue`，任务无限堆积，最终引发 **OOM**。

`Executors.newCachedThreadPool` 的 `maximumPoolSize` 是 `Integer.MAX_VALUE`，短时间大量任务会创建海量线程，同样 **OOM** 且拖垮系统。

```java
// 不推荐：隐藏风险
ExecutorService pool = Executors.newFixedThreadPool(10);

// 推荐：手动构造，明确队列容量与拒绝策略
ExecutorService pool = new ThreadPoolExecutor(
    10, 10,
    0L, TimeUnit.MILLISECONDS,
    new ArrayBlockingQueue<>(1000),   // 有界队列
    new NamedThreadFactory("biz-pool"),
    new ThreadPoolExecutor.CallerRunsPolicy());  // 明确拒绝策略
```

## 六、线程数估算

- **CPU 密集型**（如计算、加解密）：线程数 ≈ CPU 核数 + 1，过多只会增加上下文切换。
- **IO 密集型**（如网络、数据库调用）：线程常处于等待，可设更多，经验公式 `线程数 ≈ CPU 核数 × (1 + 平均等待时间 / 平均计算时间)`，常见取核数的 2 倍到数十倍，需压测确定。

## 七、自定义 ThreadFactory

给线程命名，出问题时能快速定位是哪个业务池：

```java
class NamedThreadFactory implements ThreadFactory {
    private final AtomicInteger seq = new AtomicInteger(1);
    private final String prefix;
    NamedThreadFactory(String prefix) { this.prefix = prefix; }
    @Override
    public Thread newThread(Runnable r) {
        Thread t = new Thread(r, prefix + "-" + seq.getAndIncrement());
        t.setDaemon(false);
        t.setUncaughtExceptionHandler((th, e) -> e.printStackTrace());
        return t;
    }
}
```

## 八、监控线程池

`ThreadPoolExecutor` 暴露了大量只读方法，可接 Prometheus 做监控：

```java
ThreadPoolExecutor p = (ThreadPoolExecutor) pool;
int active = p.getActiveCount();              // 正在执行任务的线程数
long completed = p.getCompletedTaskCount();   // 已完成任务总数
int poolSize = p.getPoolSize();               // 当前线程数
int queueSize = p.getQueue().size();          // 队列积压数量
```

**报警重点**：`queueSize` 持续上升代表消费跟不上，需扩容或限流；`active == maximumPoolSize` 且队列满代表已经饱和。

## 九、实际开发中的应用与常见问题

- **拒绝策略默认抛异常**：线上若未自定义 handler，任务被拒会抛 `RejectedExecutionException`，调用方需捕获处理，否则可能中断主流程。
- **shutdown 与 shutdownNow**：`shutdown()` 平缓停止（不再接新任务，等已提交任务跑完）；`shutdownNow()` 尝试中断所有线程并返回未执行任务。应用关闭时要正确释放线程池。
- **任务要吞掉异常**：线程池里的任务若抛未捕获异常，线程可能终止，任务“静默失败”。务必在 `Runnable` 内部 `try/catch`，或用 `submit` 拿 `Future` 检查异常。
- **不要用无界队列 + 固定线程**：这是 OOM 的高发组合；始终用有界队列并配合合理拒绝策略。
- **核心线程预热**：默认核心线程是懒创建，关键服务可调用 `prestartAllCoreThreads()` 提前建好，避免冷启动抖动。
