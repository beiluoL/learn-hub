---
title: 并发集合：ConcurrentHashMap 与 CopyOnWrite 容器
category: java
level: advanced
readMinutes: 20
order: 21
tags: "ConcurrentHashMap, 并发, CAS, 阻塞队列"
summary: 剖析 ConcurrentHashMap 1.8 的 CAS+synchronized 实现与各类并发容器选型。
prereq: java/java-collections, java/java-concurrency
---

## 一、为什么普通容器不能用于并发

`HashMap`、`ArrayList` 等都不是线程安全的。如果直接用 `synchronized` 包住整个容器，所有读写都串行化，在“读多写少”场景下性能极差。`java.util.concurrent` 包提供了一系列为并发优化的容器，核心思想是：**缩小锁粒度、用 CAS 无锁化、读写分离**。

本文将重点剖析 `ConcurrentHashMap` 1.8 的实现，并介绍 `CopyOnWrite` 系列与 `ConcurrentSkipListMap`。

## 二、ConcurrentHashMap 1.7 的分段锁

JDK 1.7 的 `ConcurrentHashMap` 内部维护一个 `Segment` 数组，每个 `Segment` 本质是一个小的 `HashMap`，并独立加锁（继承 `ReentrantLock`）。

- 写操作只锁住对应的一个 `Segment`，不同 `Segment` 上的写可以并发。
- 默认 16 个 `Segment`，理论上支持 16 个线程同时写。

缺点是：并发度被 `Segment` 数量上限死；且 `size()` 要遍历所有段并加锁统计，开销大。

## 三、ConcurrentHashMap 1.8 的 CAS + synchronized 锁桶

1.8 彻底抛弃了分段锁，改为**对单个桶（数组的一个槽位）加锁**，进一步把锁粒度降到最低。

```java
// JDK 1.8 核心结构（简化）
transient volatile Node<K,V>[] table;
private transient volatile int sizeCtl;  // 控制表初始化与扩容的核心变量
```

**sizeCtl 的含义**：

- 负数：表正在初始化或扩容（`-1` 表示初始化中，`-(1+n)` 表示有 n 个线程正在协助扩容）。
- 0：尚未初始化。
- 正数：下一次扩容的阈值（容量 × 0.75）。

**为什么放弃分段锁**：分段锁在扩容、统计 size 时需要处理多个段，复杂度高，且段数固定无法随 CPU 核数弹性扩展。1.8 直接锁单桶，配合 CAS 无锁初始化、volatile 读，并发度与 CPU 核数成正比，性能更优。

## 四、put 流程（1.8）

```java
final V putVal(K key, V value, boolean onlyIfAbsent) {
    if (key == null || value == null) throw new NullPointerException();
    int hash = spread(key.hashCode());  // 类似 HashMap 的扰动
    int binCount = 0;
    for (Node<K,V>[] tab = table;;) {
        Node<K,V> f; int n, i, fh;
        if (tab == null || (n = tab.length) == 0)
            tab = initTable();              // CAS 无锁初始化表
        else if ((f = tabAt(tab, i = (n - 1) & hash)) == null) {
            if (casTabAt(tab, i, null, new Node<>(hash, key, value, null)))
                break;                      // 桶为空，CAS 直接放，不加锁
        }
        else if ((fh = f.hash) == MOVED)
            tab = helpTransfer(tab, f);     // 发现 ForwardingNode，协助扩容
        else {
            V oldVal = null;
            synchronized (f) {              // 桶不为空，只锁当前桶的头节点
                // 遍历链表/红黑树，覆盖或追加；超阈值树化
            }
        }
    }
    addCount(1L, binCount);                 // 更新 size，可能触发扩容
    return null;
}
```

**关键设计**：

- 桶为空时用 `CAS` 无锁插入，只有真正冲突才 `synchronized` 锁住单个桶，锁粒度极小。
- **ForwardingNode**：扩容时旧表的桶会被替换成一个特殊的 `ForwardingNode`（hash 值为 `MOVED`），标识“这个桶已经迁移到新表”，读到它的线程会去新表找，或调用 `helpTransfer` 帮忙迁移。
- **helpTransfer**：多线程并发 `put` 时，若发现正在扩容，当前线程会参与数据迁移，加速扩容完成，避免单线程迁移瓶颈。

## 五、CopyOnWriteArrayList / CopyOnWriteArraySet

这两个容器采用**写时复制**策略：

```java
public boolean add(E e) {
    final ReentrantLock lock = this.lock;
    lock.lock();
    try {
        Object[] elements = getArray();
        Object[] newElements = Arrays.copyOf(elements, elements.length + 1);
        newElements[elements.length] = e;
        setArray(newElements);   // 替换整个数组引用
        return true;
    } finally { lock.unlock(); }
}
```

**原理**：每次修改都复制一份新数组，改完再替换引用。读操作完全不加锁，直接读当前数组。

**适用场景**：**读多写少**。例如监听器列表、黑白名单、配置项缓存——读远多于写，且能容忍写后短暂读到旧数据（最终一致性）。

**不适用场景**：写频繁会频繁复制大数组，内存与 GC 压力巨大。

## 六、ConcurrentSkipListMap

基于**跳表（Skip List）**实现的有序并发映射，相当于并发版的 `TreeMap`：

- 支持 `key` 自然排序或自定义 `Comparator`。
- 所有操作无锁（CAS），支持更高的并发度。
- 常用于需要有序且并发访问的场景，如按时间排序的订单缓存。

## 七、BlockingQueue 家族简介

阻塞队列既是容器也是线程间通信工具，下文在队列专题会展开，这里先列全貌：

- `ArrayBlockingQueue`：有界、数组、单锁。
- `LinkedBlockingQueue`：链表、可选有界、双锁。
- `SynchronousQueue`：不存储元素，直接交接。
- `PriorityBlockingQueue`：无界、基于堆、按优先级出队。
- `DelayQueue`：基于优先级堆，按延迟时间出队。

## 八、代码示例：并发计数统计

下面用 `ConcurrentHashMap` + `LongAdder` 实现多线程安全的词频统计：

```java
import java.util.concurrent.*;
import java.util.concurrent.atomic.LongAdder;

public class ConcurrentWordCount {
    public static void main(String[] args) throws InterruptedException {
        ConcurrentHashMap<String, LongAdder> map = new ConcurrentHashMap<>();
        String[] words = {"a", "b", "a", "c", "b", "a"};

        ExecutorService pool = Executors.newFixedThreadPool(4);
        for (String w : words) {
            pool.execute(() -> {
                // computeIfAbsent + LongAdder，线程安全且高效
                map.computeIfAbsent(w, k -> new LongAdder()).increment();
            });
        }
        pool.shutdown();
        pool.awaitTermination(1, TimeUnit.SECONDS);

        map.forEach((k, v) -> System.out.println(k + " => " + v.sum()));
    }
}
```

`computeIfAbsent` 在 1.8 中针对不存在的 key 做了优化，不会锁住整个桶，配合 `LongAdder`（分段计数，减少 CAS 竞争）是并发计数的最佳实践。

## 九、实际开发中的应用与常见问题

- **不要假设 size() 绝对精确**：`ConcurrentHashMap.size()` 在并发写入时返回的是近似值（累加各段计数），要求强一致计数请用 `LongAdder` 或原子变量单独维护。
- **computeIfAbsent 的递归陷阱**：1.8 中 `computeIfAbsent` 的映射函数里不能再调用该 map 的其他写方法，否则可能抛出 `IllegalStateException`（检测到了递归更新）。
- **CopyOnWrite 慎用大数据量**：元素超过几千、写频繁时，复制成本会拖垮性能，应改用 `ConcurrentHashMap` 或加读写锁。
- **选型对照**：需要并发 Map 用 `ConcurrentHashMap`；需要有序并发 Map 用 `ConcurrentSkipListMap`；读多写少列表用 `CopyOnWriteArrayList`；线程间传递任务用阻塞队列。
