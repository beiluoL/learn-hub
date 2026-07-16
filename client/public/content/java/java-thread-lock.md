---
title: 锁机制：synchronized 锁升级与 ReentrantLock / AQS
category: java
level: advanced
readMinutes: 24
order: 24
tags: "synchronized, 锁升级, AQS, ReentrantLock, 读写锁"
summary: 深入对象头、锁升级过程与 AQS 队列同步器实现读写锁。
prereq: java/java-concurrency
---

## 一、从对象头说起

Java 中每个对象都关联一个**对象头（Object Header）**，HotSpot 虚拟机里对象头包含：

- **Mark Word**：存哈希码、分代年龄、**锁状态标志**、偏向线程 ID 等，长度在 32 位 JVM 为 32 bit，64 位为 64 bit。锁的信息主要就在这里。
- **Klass Pointer**：指向类的元数据。

`synchronized` 上锁的本质，就是修改对象 Mark Word 里的锁标志位，并关联到持有锁的线程。理解 Mark Word 才能理解后面的锁升级。

## 二、synchronized 的锁升级过程

JDK 1.6 之后 `synchronized` 做了大量优化，不再是“一来就重量级”。它会根据竞争程度逐步升级，且不可逆（只能升不能降）：

- **无锁**：对象刚创建，没有任何线程持有。
- **偏向锁**：第一个线程访问同步块时，在 Mark Word 记录该线程 ID（偏向它）。之后该线程再进入，只需比对 ID，几乎零开销。适用于“一直同一个线程访问”的场景。
- **轻量级锁**：当有第二个线程来竞争，偏向锁被撤销，升级为轻量级锁。线程通过 **CAS 自旋**尝试把 Mark Word 改为指向自己栈帧的锁记录；自旋期间不阻塞，适合“临界区极短、竞争不激烈”的场景。
- **重量级锁**：自旋超过一定次数（或线程数多），膨胀为重量级锁，依赖操作系统 `monitor`（互斥量），竞争失败的线程进入**阻塞**状态，由内核调度，开销最大但吞吐稳定。

**为什么要这样设计**：大多数同步块实际只有单线程访问或极短暂竞争。偏向锁/轻量级锁用 CAS 把“加锁”从内核态开销降到用户态几条指令；只有真的竞争激烈才动用昂贵的操作系统互斥。这是“乐观→悲观”的渐进策略。

## 三、synchronized 的可重入性

```java
public class ReentrantDemo {
    synchronized void a() {
        System.out.println("进入 a");
        b();   // 同一线程调用另一个 synchronized 方法，可重入
    }
    synchronized void b() {
        System.out.println("进入 b");
    }
}
```

同一个线程可以重复获取同一把锁，JVM 用锁记录计数（monitor 的 `_recursions`），每进入一次 +1，退出一次 -1，归零才真正释放。这避免了“自己锁自己”的死锁。

## 四、ReentrantLock 与 synchronized 对比

`ReentrantLock` 是 `java.util.concurrent.locks` 下的显式锁，需要手动 `lock()` 和 `unlock()`（务必放 `finally` 中）。

| 维度 | synchronized | ReentrantLock |
| --- | --- | --- |
| 释放方式 | 自动（出作用域释放） | 手动 `unlock()`，易漏写 |
| 可中断 | 不可中断 | `lockInterruptibly()` 可响应中断 |
| 公平锁 | 非公平 | 可指定公平/非公平 |
| 尝试获取 | 无 | `tryLock()` / `tryLock(timeout)` |
| 条件变量 | 单一 `wait/notify` | 多个 `Condition`，灵活 |
| 性能 | 1.6 后已大幅优化，接近 | 高竞争下略优 |

**建议**：能用 `synchronized` 就用它（简单、自动释放、不易出错）；需要可中断、超时、公平锁或多条件等待时再用 `ReentrantLock`。

```java
ReentrantLock lock = new ReentrantLock();
lock.lock();
try {
    // 临界区
} finally {
    lock.unlock();   // 必须放在 finally，保证异常也能释放
}
```

## 五、AQS：队列同步器核心

`AbstractQueuedSynchronizer`（AQS）是并发包绝大多数同步工具（ReentrantLock、Semaphore、CountDownLatch、读写锁）的底层骨架。

**三大核心**：

- **state**：一个 `volatile int`，表示同步状态。例如 ReentrantLock 用它记录重入次数；Semaphore 用它记录剩余许可。
- **CLH 队列**：一个 FIFO 的等待线程双向队列。抢不到锁的线程被包装成节点入队、自旋/阻塞等待。
- **独占 / 共享模式**：独占（如锁，同一时刻一个线程占有）与共享（如信号量，多个线程可同时占有）。

AQS 通过 `CAS` 修改 `state` 实现加锁，失败则入队；释放时修改 `state` 并唤醒队首节点。子类只需实现 `tryAcquire` / `tryRelease`（独占）或 `tryAcquireShared` / `tryReleaseShared`（共享）即可。

**公平 vs 非公平**：非公平锁抢锁时先直接 CAS 抢（可能插队），抢不到才排队；公平锁严格按队列顺序，不会插队但吞吐量略低。`ReentrantLock` 默认非公平（性能更好），可传 `true` 构造公平锁。

## 六、ReadWriteLock 读写锁

`ReentrantReadWriteLock` 把锁拆成两把：

- **读锁（共享）**：多个线程可同时读。
- **写锁（独占）**：写时独占，读和写都阻塞。

适用于**读多写少**（如配置缓存、本地字典）的场景，比纯互斥锁并发度高得多。

```java
class Cache {
    private final Map<String, String> map = new HashMap<>();
    private final ReentrantReadWriteLock rw = new ReentrantReadWriteLock();
    private final Lock r = rw.readLock();
    private final Lock w = rw.writeLock();

    public String get(String k) {
        r.lock();
        try { return map.get(k); }
        finally { r.unlock(); }
    }
    public void put(String k, String v) {
        w.lock();
        try { map.put(k, v); }
        finally { w.unlock(); }
    }
}
```

## 七、代码示例：交替打印与读写锁缓存

交替打印（两线程交替输出 A/B），体现 `wait/notify` 与锁配合：

```java
public class AlternatePrint {
    private static final Object lock = new Object();
    private static boolean flag = true;

    public static void main(String[] args) {
        new Thread(() -> {
            for (int i = 0; i < 5; i++) {
                synchronized (lock) {
                    while (!flag) { try { lock.wait(); } catch (InterruptedException e) {} }
                    System.out.print("A"); flag = false; lock.notifyAll();
                }
            }
        }).start();
        new Thread(() -> {
            for (int i = 0; i < 5; i++) {
                synchronized (lock) {
                    while (flag) { try { lock.wait(); } catch (InterruptedException e) {} }
                    System.out.print("B"); flag = true; lock.notifyAll();
                }
            }
        }).start();
    }
}
```

## 八、实际开发中的应用与常见问题

- **减小锁粒度与范围**：只把真正共享的、非原子的操作放进同步块；同步块越大，竞争越激烈，性能越差。能用局部变量就别用共享变量。
- **死锁四条件**：互斥、占有且等待、不可剥夺、循环等待。避免死锁的经典做法是**按固定顺序获取多把锁**。
- **ReentrantLock 必须 try/finally 释放**：忘记 `unlock` 等于永久持锁，后续线程全部饿死。
- **读锁不升级为写锁**：`ReentrantReadWriteLock` 不支持锁升级（持有读锁时去拿写锁会死锁）；需要升级时应先释放读锁再获取写锁。
- **偏向锁在高度竞争下是负担**：某些高并发服务可关闭偏向锁（`-XX:-UseBiasedLocking`）以减少撤销开销；JDK 15 后已默认禁用偏向锁。
- **优先用 synchronized**：除非明确需要可中断、超时、公平或多条件，否则 `synchronized` 更不易出错。
