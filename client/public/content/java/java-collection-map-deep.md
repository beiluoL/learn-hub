---
title: HashMap 深度剖析：哈希扰动、扩容机制与红黑树
category: java
level: advanced
readMinutes: 22
tags: "HashMap, 哈希, 扩容, 红黑树, 并发"
summary: 从源码层面讲透 HashMap 的 hash 计算、扩容机制与链表转红黑树的阈值。
order: 20
prereq: java/java-collections
---

## 一、为什么需要 HashMap

`HashMap` 是 Java 中最常用的键值对容器，它能在平均 O(1) 的时间复杂度内完成插入、查找与删除。理解它的底层实现，不只是为了面试，更能在出现“数据莫名丢失”“并发下数据错乱”“内存暴涨”等问题时，快速定位根因。

本文基于 JDK 1.8 源码，逐层拆解 `HashMap` 的内部结构、哈希算法、扩容机制与树化逻辑。

## 二、整体数据结构

JDK 1.8 的 `HashMap` 由三部分组成：

- **数组（table）**：存放桶（bucket）的头节点，长度永远是 2 的幂。
- **链表**：当多个 key 落到同一个桶时发生哈希冲突，冲突元素以链表形式挂在桶后。
- **红黑树**：当链表过长（>= 8）且数组容量 >= 64 时，链表转为红黑树，把查找复杂度从 O(n) 降到 O(log n)。

```java
// HashMap 的核心字段（简化）
transient Node<K,V>[] table;   // 桶数组
transient int size;            // 实际键值对数量
int threshold;                 // 扩容阈值 = 容量 * 负载因子
final float loadFactor;        // 负载因子，默认 0.75
```

## 三、哈希扰动函数 hash()

`HashMap` 计算桶下标时，并不是直接用 `key.hashCode()`，而是先经过一次扰动：

```java
static final int hash(Object key) {
    int h;
    // key 为 null 时返回 0，否则高 16 位与低 16 位异或
    return (key == null) ? 0 : (h = key.hashCode()) ^ (h >>> 16);
}
```

**为什么要扰动**：`hashCode()` 是一个 32 位整数，但定位桶时只用低几位（`(n-1) & hash`）。如果直接用原始 hashCode，高 16 位的变化会被忽略，容易导致分布不均。把高 16 位异或到低 16 位，能让高位也参与运算，减少碰撞。

**key 为 null 的处理**：`HashMap` 允许 key 为 null，此时 hash 固定为 0，元素被放到下标 0 的桶里。这也是 `HashMap` 与 `Hashtable`（不允许 null key）的区别之一。

## 四、桶下标定位：为什么容量是 2 的幂

定位桶下标的代码是 `(n - 1) & hash`，其中 `n` 是数组长度。

```java
// 等价于 hash % n，但要求 n 必须是 2 的幂
int index = (n - 1) & hash;
```

**为什么容量必须是 2 的幂**：当 `n` 是 2 的幂时，`n - 1` 的二进制全为 1（例如 16 的 `n-1` 是 15，二进制 `1111`）。此时 `(n-1) & hash` 就等价于 `hash % n`，但位运算比取模快得多。如果容量不是 2 的幂，`&` 就不再是取模，分布会严重不均。

所以 `HashMap` 在扩容或初始化时，会把你传入的容量“向上取整”到最近的 2 的幂：

```java
// tableSizeFor：把任意数变成 >= 它的最小 2 的幂
static final int tableSizeFor(int cap) {
    int n = cap - 1;
    n |= n >>> 1;
    n |= n >>> 2;
    n |= n >>> 4;
    n |= n >>> 8;
    n |= n >>> 16;
    return (n < 0) ? 1 : (n >= MAXIMUM_CAPACITY) ? MAXIMUM_CAPACITY : n + 1;
}
```

## 五、put 流程全解析

`put(K key, V value)` 的核心逻辑如下（简化伪代码）：

```java
public V put(K key, V value) {
    // 1. 计算扰动后的 hash
    int hash = hash(key);
    // 2. 如果 table 为空，先扩容（懒加载）
    if (table == null || table.length == 0) resize();
    // 3. 定位桶下标
    int i = (table.length - 1) & hash;
    Node<K,V> p = table[i];
    if (p == null) {
        // 4. 桶为空，直接新建节点放入
        table[i] = new Node<>(hash, key, value, null);
    } else {
        // 5. 桶不为空，遍历链表/红黑树，找到相同 key 则覆盖，否则追加
        //    若链表长度达到 8 且容量 >= 64，则树化
    }
    // 6. size+1，若超过阈值 threshold，则 resize() 扩容
    if (++size > threshold) resize();
    return oldValue;
}
```

**注意**：JDK 1.8 中链表的新节点是**尾插法**（追加到链表末尾），这是为了避免 1.7 头插法在并发下形成环形链表的问题（见后文）。

## 六、扩容机制：2 倍扩容与 rehash

当 `size` 超过 `容量 × 负载因子（0.75）` 时触发扩容，新容量是旧容量的 **2 倍**，阈值也同步翻倍。

```java
final Node<K,V>[] resize() {
    Node<K,V>[] oldTab = table;
    int oldCap = (oldTab == null) ? 0 : oldTab.length;
    int oldThr = threshold;
    int newCap, newThr;
    if (oldCap > 0) {
        // 超过最大容量则不再扩容
        if (oldCap >= MAXIMUM_CAPACITY) { threshold = Integer.MAX_VALUE; return oldTab; }
        // 容量翻倍
        newCap = oldCap << 1;
        newThr = oldThr << 1;
    }
    // ... 初始化分支省略
    threshold = newThr;
    // 创建新数组，并把旧元素 rehash 迁移到新数组
    Node<K,V>[] newTab = (Node<K,V>[]) new Node[newCap];
    table = newTab;
    // 迁移：每个元素要么留在原下标，要么去 原下标 + oldCap
    return newTab;
}
```

**rehash 的巧妙之处**：因为容量翻倍且是 2 的幂，每个元素的新位置只可能是“原位置”或“原位置 + 旧容量”。通过 `(e.hash & oldCap) == 0` 判断：为 0 留在原地，非 0 迁移到 `原下标 + oldCap`。这避免了重新计算 hashCode，只需一次位运算。

**负载因子 0.75 的来历**：这是时间与空间成本的折中。因子过小（如 0.5）会让空间浪费严重、扩容频繁；过大（如 1.0）会增加哈希冲突、拉低查找效率。0.75 是在泊松分布下对冲突概率的统计学平衡。

## 七、链表与红黑树的转换阈值

树化相关常量：

```java
static final int TREEIFY_THRESHOLD = 8;     // 链表转树阈值
static final int UNTREEIFY_THRESHOLD = 6;   // 树退化回链表阈值
static final int MIN_TREEIFY_CAPACITY = 64; // 树化要求的最小容量
```

**转树条件（同时满足）**：

- 链表长度 >= 8
- 数组容量 >= 64

如果链表已经 8 但容量还不到 64，HashMap 选择先扩容而不是树化——因为扩容能直接重新散列，往往比树化更划算。

**退化条件**：当红黑树节点数 <= 6 时，退化回链表。阈值 8 与 6 之间留了 2 的缓冲，避免频繁在“树—链表”之间来回切换（抖动）。

**为什么是 8**：根据泊松分布，在负载因子 0.75 下，一个桶里链表长度达到 8 的概率约为千万分之六（0.00000006），几乎不可能发生，所以绝大多数桶都是链表；一旦真到了 8，说明哈希分布极不均匀（或遭遇恶意碰撞攻击），此时转树保证性能。

## 八、为什么 HashMap 线程不安全

**JDK 1.7 的头插法死循环**：1.7 扩容时用头插法迁移链表，多线程同时扩容可能把链表指针反转形成环，下次 `get` 时陷入死循环，CPU 飙升 100%。

**数据覆盖**：无论 1.7 还是 1.8，多线程同时 `put` 且发生哈希冲突时，可能两个线程同时判读“桶为空”并写入，后写的覆盖先写的，导致数据丢失。此外 `size++` 也不是原子操作，并发计数会偏小。

**结论**：多线程场景请使用 `ConcurrentHashMap`，不要用 `HashMap` 加外部同步（粒度太粗、性能差），更不要误用 `Hashtable`（方法全 synchronized，效率极低）。

## 九、实际开发中的应用与常见问题

- **初始化时指定容量**：若已知要存 1000 个元素，应 `new HashMap<>(1333)`（1000 / 0.75 并向上取整为 2 的幂），避免中途多次扩容产生的 rehash 开销。
- **key 必须重写 equals 和 hashCode**：只重写其一或让它们不一致，会导致“同一个逻辑 key 却查不到值”。`equals` 相等的对象 `hashCode` 必须相等，反之不要求。
- **key 使用可变对象的风险**：如果把一个对象当 key 放入后，又修改了参与 `hashCode` 计算的字段，就再也 `get` 不出来了。尽量用 `String`、包装类等不可变类型当 key。
- **不要用 HashMap 做缓存计数**：并发累加要用 `ConcurrentHashMap` 配合 `AtomicLong` 或 `LongAdder`，避免数据覆盖。
