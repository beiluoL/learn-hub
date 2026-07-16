---
title: Queue 与阻塞队列：ArrayBlockingQueue / LinkedBlockingQueue / PriorityBlockingQueue
category: java
level: intermediate
readMinutes: 16
order: 22
tags: "队列, 阻塞队列, 线程池, 生产者消费者"
summary: 系统讲解 Queue 体系与阻塞队列在生产者-消费者模型中的应用。
prereq: java/java-collections
---

## 一、Queue 接口体系

`Queue` 是 Java 集合框架中表示“队列”的接口，遵循“先进先出（FIFO）”原则。与之相关的还有双向队列 `Deque`（两端都能进出，可作栈或队列）。

```java
public interface Queue<E> extends Collection<E> {
    boolean add(E e);          // 插入，满则抛异常
    boolean offer(E e);        // 插入，满则返回 false（推荐）
    E remove();                // 取并删除队首，空则抛异常
    E poll();                  // 取并删除队首，空则返回 null（推荐）
    E element();               // 只看队首，空则抛异常
    E peek();                  // 只看队首，空则返回 null（推荐）
}
```

**设计要点**：`Queue` 把“操作失败”分成两种处理方式——抛异常（add/remove/element）和返回特殊值（offer/poll/peek）。在并发或不确定容量时，应优先用返回特殊值的一组方法，避免频繁捕获异常。

## 二、BlockingQueue 阻塞语义

`BlockingQueue` 是 `Queue` 的子接口，最核心的能力是**阻塞**：

- **put(E e)**：队列满时，当前线程阻塞，直到有空位。
- **take()**：队列空时，当前线程阻塞，直到有元素。

这组阻塞方法正是实现“生产者—消费者”模型的基石，也是线程池 `ThreadPoolExecutor` 内部传递任务的关键。

## 三、常见阻塞队列对比

| 队列 | 底层 | 是否有界 | 锁 | 特点 |
| --- | --- | --- | --- | --- |
| `ArrayBlockingQueue` | 数组 | 有界（必须指定容量） | 单把锁 | 公平/非公平可选，内存紧凑 |
| `LinkedBlockingQueue` | 链表 | 无界或可选有界 | 双锁（入队/出队分离） | 默认容量 Integer.MAX_VALUE，吞吐高 |
| `SynchronousQueue` | 无存储 | 0 容量 | 无 | 直接交接，每个 put 必须等一个 take |
| `PriorityBlockingQueue` | 堆 | 无界 | 单锁 | 按优先级出队，非 FIFO |
| `DelayQueue` | 堆 | 无界 | 单锁 | 按延迟时间出队，元素需实现 Delayed |

**ArrayBlockingQueue vs LinkedBlockingQueue**：前者容量固定、一把锁，入队出队互斥；后者默认无界、用两把锁（takeLock / putLock）把入队和出队解耦，高并发下吞吐通常更高，但要注意它默认近乎无界，可能堆积导致 OOM。

**SynchronousQueue**：不存储任何元素，生产者 `put` 必须等到消费者 `take` 接手，相当于“直接交接”。线程池 `newCachedThreadPool` 就用它，适合任务处理极快、需要立即执行的场景。

## 四、生产者—消费者完整示例

下面用 `ArrayBlockingQueue` 实现一个典型的生产者—消费者模型：

```java
import java.util.concurrent.*;

public class ProducerConsumer {
    public static void main(String[] args) throws InterruptedException {
        // 容量为 5 的有界队列
        BlockingQueue<String> queue = new ArrayBlockingQueue<>(5);

        // 生产者：每隔 200ms 放入一个任务
        Thread producer = new Thread(() -> {
            try {
                for (int i = 1; i <= 10; i++) {
                    queue.put("任务-" + i);   // 满了会阻塞
                    System.out.println("生产 " + "任务-" + i + "，队列剩余=" + queue.remainingCapacity());
                    Thread.sleep(200);
                }
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            }
        });

        // 消费者：每隔 500ms 取一个任务
        Thread consumer = new Thread(() -> {
            try {
                for (int i = 1; i <= 10; i++) {
                    String task = queue.take();  // 空了会阻塞
                    System.out.println("消费 " + task);
                    Thread.sleep(500);
                }
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            }
        });

        producer.start();
        consumer.start();
        producer.join();
        consumer.join();
    }
}
```

运行后能看到：队列满时生产者自动等待，队列空时消费者自动等待，二者通过队列自然地实现了解耦与流量削峰。

## 五、阻塞队列在线程池中的角色

`ThreadPoolExecutor` 的构造参数里就有一个 `BlockingQueue<Runnable> workQueue`，它决定了“核心线程忙完之后，新任务去哪”：

- 用 `SynchronousQueue`：`newCachedThreadPool`，任务直接交给空闲线程或新建线程。
- 用无界 `LinkedBlockingQueue`：`newFixedThreadPool`，任务无限堆积（有 OOM 风险）。
- 用有界 `ArrayBlockingQueue`：自定义线程池时推荐，配合拒绝策略保护系统。

线程池工作流程：核心线程 → 满则入队 → 队列满则建非核心线程 → 再满则触发拒绝策略。可见阻塞队列是线程池的“缓冲池”。

## 六、实际开发中的应用与常见问题

- **选有界队列**：生产环境务必用有界队列（如 `ArrayBlockingQueue`），避免任务无限堆积压垮内存；无界队列只在能严格保证消费速度时才考虑。
- **阻塞方法要处理中断**：`put/take` 会抛出 `InterruptedException`，捕获后应当恢复中断标志（`Thread.currentThread().interrupt()`）或做优雅退出，不要吞掉异常。
- **poll 超时比 take 更可控**：若不想无限等待，用 `poll(timeout, unit)`，超时返回 null，方便做超时告警。
- **PriorityBlockingQueue 非 FIFO**：不要误以为它按插入顺序出队；需要按业务优先级调度任务时再选它，且元素必须正确实现 `Comparable`。
- **注意容量与消费者数量匹配**：队列太小容易让生产者频繁阻塞，太大又浪费内存并延迟问题暴露，需结合压测调优。
