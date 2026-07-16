---
question: 如何手写一个 LRU 缓存？用什么数据结构？时间复杂度是多少？
category: system
difficulty: hard
tags: "LRU, 缓存, 哈希表, 双向链表, LinkedHashMap"
order: 76
---

## LRU 缓存的设计与实现

**核心结论**：使用哈希表 + 双向链表实现 O(1) 时间的 put 和 get。链表维护访问顺序（头=最新、尾=最旧），哈希表实现 O(1) 定位节点。

---

### 数据结构设计

```
哈希表                      双向链表
┌───────┐                 ┌──────────────────────────────┐
│ key→Node              │ Head ⟷ Node1 ⟷ Node2 ⟷ ... ⟷ Tail │
└───────┘                 └──────────────────────────────┘
                         ← 旧（LRU端）       新（MRU端）→
```

**为什么是哈希表 + 双向链表**：

- **哈希表**：解决"给定 key 快速找到节点"的问题，O(1) 查找。
- **双向链表**：解决"高效的插入和删除"问题。将任意节点移动到链表头 = O(1)（先摘除再插入头），删除链表尾 = O(1)。
- **为什么是双向**：删除给定节点需要其前驱和后驱指针。单向链表需要从头部遍历找到前驱，退化为 O(n)。
- **为什么不是数组/队列**：数组删除中间元素 = O(n)，队列只能在两端操作，中间的元素无法 O(1) 移动。

---

### 完整手写实现（Python）

```python
class Node:
    """双向链表节点"""
    def __init__(self, key=0, value=0):
        self.key = key
        self.value = value
        self.prev = None
        self.next = None


class LRUCache:
    def __init__(self, capacity: int):
        self.capacity = capacity
        self.cache = {}  # key → Node 的哈希表
        # 虚拟头尾节点，简化边界处理
        self.head = Node()
        self.tail = Node()
        self.head.next = self.tail
        self.tail.prev = self.head

    def _remove(self, node: Node):
        """从链表中摘除节点"""
        node.prev.next = node.next
        node.next.prev = node.prev

    def _add_to_head(self, node: Node):
        """将节点添加到头部（虚拟头之后）"""
        node.next = self.head.next
        node.prev = self.head
        self.head.next.prev = node
        self.head.next = node

    def _move_to_head(self, node: Node):
        """将已有节点移到头部 ———— 先摘除再插入"""
        self._remove(node)
        self._add_to_head(node)

    def _pop_tail(self) -> Node:
        """弹出尾部节点（最久未使用）"""
        node = self.tail.prev
        self._remove(node)
        return node

    def get(self, key: int) -> int:
        if key not in self.cache:
            return -1
        node = self.cache[key]
        self._move_to_head(node)  # 标记为最近使用
        return node.value

    def put(self, key: int, value: int):
        if key in self.cache:
            # key 已存在：更新值 + 移到头部
            node = self.cache[key]
            node.value = value
            self._move_to_head(node)
        else:
            # key 不存在：新建节点 + 移到头部
            # 缓存已满：删除最久未使用的节点
            if len(self.cache) == self.capacity:
                removed = self._pop_tail()
                del self.cache[removed.key]
            node = Node(key, value)
            self.cache[key] = node
            self._add_to_head(node)
```

**时间复杂度**：

| 操作 | 时间复杂度 | 说明 |
|------|-----------|------|
| get(key) | O(1) | 哈希查找 + 链表节点移动 |
| put(key, value) | O(1) | 哈希插入/更新 + 链表操作 |
| 空间复杂度 | O(capacity) | 哈希表 + 链表各存储 capacity 个节点 |

---

### LinkedHashMap 三行实现（Java）

Java 的 `LinkedHashMap` 在构造时设置 `accessOrder=true` 即为 LRU 缓存：

```java
public class LRUCache<K, V> extends LinkedHashMap<K, V> {
    private final int capacity;

    public LRUCache(int capacity) {
        // accessOrder=true：按访问顺序排序（不是插入顺序）
        super(capacity, 0.75f, true);
        this.capacity = capacity;
    }

    @Override
    protected boolean removeEldestEntry(Map.Entry<K, V> eldest) {
        // 当 size > capacity 时自动删除最旧的条目
        return size() > capacity;
    }
}
```

核心原理：`accessOrder=true` 使得每次 `get`/`put` 都将该条目移到链表末尾。`removeEldestEntry` 在每次 `put` 后由 `LinkedHashMap` 自动调用。

---

### Redis 近似 LRU

Redis 作为内存数据库，精确 LRU 需要维护全局双向链表，内存开销对海量 key 过大。实际采用**采样淘汰**策略：

```
maxmemory-policy allkeys-lru  # 或 volatile-lru
maxmemory-samples 5           # 采样数量，默认 5
```

**工作原理**：

1. 当内存超过 maxmemory 时，Redis 随机采样 N 个 key（由 `maxmemory-samples` 控制）。
2. 在采样中选出访问时间戳最久远的那个 key。
3. 只淘汰这一个 key，然后检查内存是否回到阈值以下，否则继续采样淘汰。

**为什么不精确**：并非在全部 key 中找最旧的，而是在随机子集中找。采样数越大越接近精确 LRU，但 CPU 开销也更大。默认采样 5 个，在大多数场景下命中率已接近精确 LRU。Redis 7.0+ 进一步优化了采样算法，引入了更好的近似。

---

### LRU 变体对比

| 变体 | 全称 | 特点 | 典型场景 |
|------|------|------|----------|
| LRU | Least Recently Used | 按访问时间淘汰最旧 | 通用缓存，局部性原理 |
| LFU | Least Frequently Used | 按访问频率淘汰最少用的 | 热点数据保护 |
| LRU-K | LRU 的 K 次记录版 | 记录最近第 K 次访问时间 | 过滤一次性扫描的干扰 |
| 2Q | Two Queue LRU | FIFO + LRU 双队列，防止扫描污染 | 数据库 Buffer Pool |
| W-TinyLFU | Window TinyLFU | 概率计数器 + LRU 窗口，近似 LFU | Caffeine 缓存库默认策略 |
| ARC | Adaptive Replacement Cache | 自适应平衡 LRU 和 LFU | ZFS 文件系统缓存 |

**扫描污染**：一次大范围顺序扫描会瞬间将所有缓存替换为新数据，而这些新数据可能只读一次。普通 LRU 对此无能为力。LRU-K 和 2Q 通过"考察期"机制——新条目先放入小队列，多次访问后才晋升到主 LRU 队列，过滤掉一次性扫描数据。

---

### 面试官追问

**追问**：多线程环境下的 LRU 缓存如何保证线程安全？

**回答**：最简单的方式是加同步锁——整个 `get` 和 `put` 方法加 `synchronized` 或 `ReentrantReadWriteLock`（读多写少时提升并发度）。更高性能的方案是分段锁（ConcurrentHashMap 思想）——将 key 的哈希值取模分配到多个 LRU 分段，每个分段独立加锁，减少锁竞争。或者使用无锁的 ConcurrentLinkedHashMap（Google Guava 的 Cache 实现）。

**追问**：如何实现支持过期时间的 LRU？

**回答**：在每个节点上增加 `expireTime` 字段。get 时检查 key 是否过期，过期则视为未命中并删除。惰性删除（get 时检查）+ 定期扫描（后台线程批量清理）是常见的组合策略。Guava Cache 和 Caffeine 都支持 `expireAfterWrite`/`expireAfterAccess`/`refreshAfterWrite` 三种策略。
