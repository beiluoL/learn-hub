---
question: HashMap 的底层数据结构是什么？为什么链表长度达到8且数组长度>=64才转红黑树？
category: java
difficulty: middle
tags: "HashMap, 红黑树, 泊松分布, 数据结构"
order: 55
---

**核心结论**：HashMap 底层采用**数组 + 链表 + 红黑树**（JDK 8+）的结构。当链表长度达到阈值 8 且数组长度 >= 64 时，链表会转换为红黑树，以将查询复杂度从 O(n) 降低到 O(log n)。链表长度阈值设为 8 而非其他数值，是因为 HashMap 作者基于**泊松分布**的概率计算得出：在负载因子 0.75 的条件下，链表长度达到 8 的概率仅为 0.00000006，近乎不可能，因此 8 作为树化阈值既保证了正常情况不走树化开销，又能在极端哈希碰撞时兜底。

## 底层数据结构

HashMap 的核心存储是一个 `Node<K,V>[] table` 数组：

```
数组索引 = (n - 1) & hash    // n 为数组长度，等价于 hash % n
```

每个 `Node` 结构：

```java
static class Node<K,V> implements Map.Entry<K,V> {
    final int hash;
    final K key;
    V value;
    Node<K,V> next;  // 链表指针
}
```

当发生哈希碰撞时（即不同 key 算出相同的数组索引），新节点会以**尾插法**（JDK 8 之前是头插法）追加到该位置链表的末尾。

## 链表 → 红黑树的转换条件

转换需要**两个条件同时满足**：

1. 链表长度 >= `TREEIFY_THRESHOLD`（默认 8）
2. 数组 `table` 长度 >= `MIN_TREEIFY_CAPACITY`（默认 64）

条件 2 是 JDK 8 中常被忽略的关键设计：如果链表长度达到 8 但数组长度小于 64，HashMap **不会树化**，而是优先执行 `resize()` 扩容操作。理由是：数组过短本身就是哈希碰撞的根源，扩容后元素重新分散，链表自然缩短，无需引入红黑树的复杂性。

源码对应 `treeifyBin` 方法：

```java
final void treeifyBin(Node<K,V>[] tab, int hash) {
    int n, index; Node<K,V> e;
    if (tab == null || (n = tab.length) < MIN_TREEIFY_CAPACITY)
        resize();  // 数组小于 64，优先扩容
    else if ((e = tab[index = (n - 1) & hash]) != null) {
        // 满足条件，真正树化
        TreeNode<K,V> hd = null, tl = null;
        // ... 构建红黑树
    }
}
```

## 为什么阈值是 8：泊松分布

HashMap 源码注释中给出了精确的概率计算。作者假设哈希函数将元素均匀分布到各个桶（bin），每个桶的节点数服从参数 λ = 0.5 的泊松分布。公式为：

```
P(X = k) = (λ^k / k!) * e^(-λ)
```

当 λ = 0.5 时（负载因子 0.75 下扩容门槛与桶数的比值），各长度出现的概率：

| 链表长度 k | 概率 P(X = k)       |
|-----------|---------------------|
| 0         | 0.60653066          |
| 1         | 0.30326533          |
| 2         | 0.07581633          |
| 3         | 0.01263606          |
| 4         | 0.00157952          |
| 5         | 0.00015795          |
| 6         | 0.00001316          |
| 7         | 0.00000094          |
| 8         | **0.00000006**      |

链表长度达到 8 的概率约为一亿分之六，说明在好的哈希函数下几乎不可能出现。因此 `8` 作为树化阈值是合理的安全线——正常情况绝不触发树化，极端恶意哈希碰撞时能保证查询不退化到 O(n)。

## 为什么退化为链表的阈值是 6 而非 8

当红黑树节点数减少到 `UNTREEIFY_THRESHOLD`（默认 6）时，会退化回链表。阈值设计为 6 而非 8 的目的是**防止树化与退化的反复震荡**。如果树化和退化的阈值相同（都用 8），当一个桶的元素在 7~9 之间频繁增减时，会反复执行树化和退化操作，带来不必要的性能损耗。6 和 8 之间留有 7 的缓冲区间。

## put/get 流程代码解析

**put 流程**：

```java
public V put(K key, V value) {
    return putVal(hash(key), key, value, false, true);
}

final V putVal(int hash, K key, V value, boolean onlyIfAbsent,
               boolean evict) {
    Node<K,V>[] tab; Node<K,V> p; int n, i;
    // 1. table 为空则初始化
    if ((tab = table) == null || (n = tab.length) == 0)
        n = (tab = resize()).length;
    // 2. 该索引位置为空，直接放入
    if ((p = tab[i = (n - 1) & hash]) == null)
        tab[i] = newNode(hash, key, value, null);
    else {
        Node<K,V> e; K k;
        // 3. 第一个节点就是要找的 key
        if (p.hash == hash && ((k = p.key) == key || (key != null && key.equals(k))))
            e = p;
        // 4. 红黑树节点，走树的插入
        else if (p instanceof TreeNode)
            e = ((TreeNode<K,V>)p).putTreeVal(this, tab, hash, key, value);
        else {
            // 5. 链表遍历插入
            for (int binCount = 0; ; ++binCount) {
                if ((e = p.next) == null) {
                    p.next = newNode(hash, key, value, null);
                    // 如果链表长度达到 8，尝试树化
                    if (binCount >= TREEIFY_THRESHOLD - 1)
                        treeifyBin(tab, hash);
                    break;
                }
                if (e.hash == hash && ((k = e.key) == key || (key != null && key.equals(k))))
                    break;
                p = e;
            }
        }
        // 6. key 已存在，替换 value
        if (e != null) {
            V oldValue = e.value;
            if (!onlyIfAbsent || oldValue == null)
                e.value = value;
            return oldValue;
        }
    }
    ++modCount;
    // 7. 超过阈值则扩容
    if (++size > threshold)
        resize();
    return null;
}
```

**get 流程**：

```java
public V get(Object key) {
    Node<K,V> e;
    return (e = getNode(hash(key), key)) == null ? null : e.value;
}

final Node<K,V> getNode(int hash, Object key) {
    Node<K,V>[] tab; Node<K,V> first, e; int n; K k;
    if ((tab = table) != null && (n = tab.length) > 0 &&
        (first = tab[(n - 1) & hash]) != null) {
        // 1. 先检查第一个节点
        if (first.hash == hash && ((k = first.key) == key || (key != null && key.equals(k))))
            return first;
        if ((e = first.next) != null) {
            // 2. 红黑树节点，走树查找 O(log n)
            if (first instanceof TreeNode)
                return ((TreeNode<K,V>)first).getTreeNode(hash, key);
            // 3. 链表遍历查找 O(n)
            do {
                if (e.hash == hash && ((k = e.key) == key || (key != null && key.equals(k))))
                    return e;
            } while ((e = e.next) != null);
        }
    }
    return null;
}
```

## 面试官追问

**1. HashMap 的哈希函数 (n - 1) & hash 中的 hash 经过了怎样的扰动？**

JDK 8 中 `hash(key)` 的实现为 `(key == null) ? 0 : (h = key.hashCode()) ^ (h >>> 16)`。将 hashCode 的高 16 位与低 16 位异或，目的是让高位参与低位运算。因为数组长度通常较小（如默认 16），索引计算 `(n - 1) & hash` 只用到低有效位，高位信息若不参与扰动就会白白浪费，导致碰撞概率增大。高低位异或后，混合了高位特征，分布更均匀。

**2. JDK 7 的 HashMap 头插法会导致什么问题？**

JDK 7 头插法在多线程扩容时会导致**死循环**（环形链表）。扩容时链表节点会倒序重新分配到新数组，头插法反转顺序，如果两个线程同时扩容，可能互相引用形成闭环。JDK 8 改用尾插法，虽然仍非线程安全（推荐使用 ConcurrentHashMap），但不会出现死循环。
