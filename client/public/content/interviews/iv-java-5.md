---
question: 线程池 ThreadPoolExecutor 的核心参数有哪些？任务提交后的执行流程是怎样的？
category: java
difficulty: middle
tags: "线程池, 拒绝策略, Executors, ThreadPoolExecutor"
order: 19
---

## 核心结论

**回答**：ThreadPoolExecutor 有 7 个核心参数（corePoolSize、maximumPoolSize、keepAliveTime、unit、workQueue、threadFactory、handler），任务提交后的执行流程是"核心线程 → 工作队列 → 非核心线程 → 拒绝策略"的四步级联。掌握这 7 个参数和 4 种拒绝策略是线程池面试的基本功，而理解"为什么不推荐 Executors 工厂方法"则是区分中高级候选人的分水岭。

## 7 大核心参数详解

ThreadPoolExecutor 的完整构造器如下：

```java
public ThreadPoolExecutor(
    int corePoolSize,          // 1. 核心线程数
    int maximumPoolSize,       // 2. 最大线程数
    long keepAliveTime,        // 3. 非核心线程空闲存活时间
    TimeUnit unit,             // 4. 时间单位
    BlockingQueue<Runnable> workQueue,  // 5. 工作队列
    ThreadFactory threadFactory,        // 6. 线程工厂
    RejectedExecutionHandler handler    // 7. 拒绝策略
)
```

### 参数含义

| 参数 | 含义 | 常见取值 |
|------|------|----------|
| corePoolSize | 常驻核心线程数，即使空闲也不销毁（除非 allowCoreThreadTimeOut） | CPU 核数 / (1 - 阻塞系数) |
| maximumPoolSize | 允许的最大线程数 | corePoolSize 的 2~4 倍 |
| keepAliveTime + unit | 非核心线程空闲超过该时间后被销毁 | 60s |
| workQueue | 存放等待执行任务的阻塞队列 | LinkedBlockingQueue / SynchronousQueue / ArrayBlockingQueue |
| threadFactory | 创建线程的工厂，建议自定义设置线程名称 | Executors.defaultThreadFactory() 或自定义 |
| handler | 线程池满且队列满时的拒绝策略 | AbortPolicy（默认，抛异常） |

## 任务提交后的执行流程

当调用 `execute(Runnable)` 或 `submit(Callable)` 时，执行流程如下：

```java
// 源码简化的 execute 逻辑
public void execute(Runnable command) {
    // 第1步：当前线程数 < corePoolSize → 创建新核心线程执行
    if (workerCountOf(c) < corePoolSize) {
        if (addWorker(command, true)) return;
    }
    // 第2步：核心线程已满 → 尝试放入工作队列
    if (isRunning(c) && workQueue.offer(command)) {
        // 第3步：二次检查线程池状态
        if (!isRunning(recheck) && remove(command))
            reject(command);
        // 第4步：线程数为0（可能是core=0），补充一个线程
        else if (workerCountOf(recheck) == 0)
            addWorker(null, false);
    }
    // 第5步：队列已满 → 创建非核心线程（总数 < maximumPoolSize）
    else if (!addWorker(command, false))
        // 第6步：超过最大线程数 → 执行拒绝策略
        reject(command);
}
```

**流程口诀**：核心 → 入队 → 非核心 → 拒绝。

关键理解点：**先入队，再创建非核心线程**。这意味着即使 corePoolSize 线程都在忙，只要 workQueue 还能放进去，就不会创建新线程。只有队列满了才会启动临时（非核心）线程。

### 三种队列的差异化行为

```java
// 1. 无界队列：maximumPoolSize 形同虚设
new ThreadPoolExecutor(2, 4, 60L, TimeUnit.SECONDS,
    new LinkedBlockingQueue<>()); // 队列无限，永远不会创建第3、第4个线程

// 2. 同步队列：每个任务都要一个线程
new ThreadPoolExecutor(2, 10, 60L, TimeUnit.SECONDS,
    new SynchronousQueue<>()); // 不存储任务，直接交给线程

// 3. 有界队列：推荐的折中
new ThreadPoolExecutor(2, 4, 60L, TimeUnit.SECONDS,
    new ArrayBlockingQueue<>(100)); // 队列满后才扩容线程
```

## 4 种拒绝策略

| 策略 | 行为 | 使用场景 |
|------|------|----------|
| AbortPolicy（默认） | 抛 RejectedExecutionException | 必须感知任务被拒绝 |
| CallerRunsPolicy | 由提交任务的线程（如 main）自己执行 | 降级，让提交者慢下来形成反压 |
| DiscardPolicy | 静默丢弃，不抛异常 | 不重要的非关键任务 |
| DiscardOldestPolicy | 丢弃队列头（最老）任务，重试提交 | 丢弃旧的保留新的 |

**最佳实践**：线上建议用 CallerRunsPolicy 配合告警，自己实现 RejectedExecutionHandler 记录日志后再执行相应策略。

```java
new ThreadPoolExecutor.CallerRunsPolicy() {
    @Override
    public void rejectedExecution(Runnable r, ThreadPoolExecutor e) {
        log.warn("线程池拒绝任务, poolSize={}, activeCount={}, queueSize={}",
            e.getPoolSize(), e.getActiveCount(), e.getQueue().size());
        super.rejectedExecution(r, e); // 降级执行
    }
};
```

## 为什么不推荐 Executors 工厂方法

阿里规约明确禁止使用 Executors 创建线程池：

```java
// 禁止：newFixedThreadPool 使用无界 LinkedBlockingQueue
// OOM 风险：队列无限增长
ExecutorService pool1 = Executors.newFixedThreadPool(10);

// 禁止：newCachedThreadPool 最大线程数是 Integer.MAX_VALUE
// OOM 风险：无限创建线程
ExecutorService pool2 = Executors.newCachedThreadPool();

// 正确做法：通过 ThreadPoolExecutor 构造器手动指定参数
ThreadPoolExecutor pool = new ThreadPoolExecutor(
    4, 8, 60L, TimeUnit.SECONDS,
    new ArrayBlockingQueue<>(200),
    new ThreadFactoryBuilder().setNameFormat("biz-pool-%d").build(),
    new ThreadPoolExecutor.CallerRunsPolicy()
);
```

## 线程数估算公式

### CPU 密集型
```
线程数 = CPU 核数 + 1
```
+1 是为了在某个线程因缺页中断等原因暂停时，有一个备用线程顶上。

### IO 密集型
```
线程数 = CPU 核数 * (1 + 平均等待时间 / 平均计算时间)
       = CPU 核数 * 目标 CPU 利用率 * (1 + W/C)
```
实际工程中常用简化公式：
```
线程数 = CPU 核数 * 2 ~ CPU 核数 / (1 - 阻塞系数)
```
其中阻塞系数（IO 时间占比）通常在 0.5 ~ 0.9 之间。

**最佳实践**：公式仅是参考值，最终线程数需要通过压测验证。推荐使用动态线程池框架（如 DynamicTp），支持运行时调整参数。

## 面试追问

1. **如何优雅关闭线程池？** shutdown() 拒绝新任务但处理完已提交的，shutdownNow() 中断正在执行的并返回未执行任务列表。推荐先用 shutdown() 再 awaitTermination() 设超时。

2. **submit 和 execute 的区别？** submit 返回 Future 可获取结果和异常；execute 无返回值，异常直接抛出。submit 内部把 Callable 包装成 FutureTask。

3. **线程池状态有哪些？** RUNNING（接受新任务+处理队列）→ SHUTDOWN（拒绝新任务+处理队列）→ STOP（拒绝+中断+不处理队列）→ TIDYING（过渡态）→ TERMINATED（终止）。

4. **如何监控线程池？** 关注 poolSize、activeCount、completedTaskCount、queueSize、queueRemainingCapacity。推荐接入 Micrometer + Prometheus 或使用 Arthas 的 `thread -b` 命令。
