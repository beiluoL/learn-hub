---
question: Elasticsearch 的倒排索引原理是什么？为什么搜索比 MySQL LIKE 快得多？
category: java
difficulty: hard
tags: "Elasticsearch, 倒排索引, 全文检索, FST, 分词"
order: 64
---

**核心结论**：倒排索引（Inverted Index）是 Elasticsearch 高性能全文检索的核心。与传统的正排索引（文档 ID → 词项列表）相反，倒排索引以**词项（Term）为键**，存储该词出现在哪些文档中、以及出现的位置和频率。搜索时直接通过词查找对应的文档列表，复杂度为 O(1) 而非 O(n)，因此比 MySQL 的 `LIKE '%keyword%'` 全表扫描快数个数量级。ES 通过 **Term Dictionary（FST 前缀压缩）→ Term Index（内存跳表）→ Posting List（Skip List 跳表合并）** 三层结构实现了极致的检索性能。

## 正排索引 vs 倒排索引

假设有三篇文档：

```
文档1: "Java 并发编程的艺术"
文档2: "Java 虚拟机调优指南"
文档3: "Python 编程入门教程"
```

**正排索引** 是从文档出发，记录每篇文档包含哪些词：

| 文档ID | 内容词列表                       |
|--------|--------------------------------|
| 1      | Java, 并发, 编程, 艺术            |
| 2      | Java, 虚拟, 机, 调优, 指南         |
| 3      | Python, 编程, 入门, 教程          |

搜索 "Java" → 需要遍历所有文档 → O(n)。这就是 MySQL `LIKE '%keyword%'` 低效的根本原因。

**倒排索引** 是从词出发，记录每个词出现在哪些文档中：

| 词项（Term） | 文档ID列表（Posting List） | 位置信息 |
|-------------|--------------------------|---------|
| Java        | [1, 2]                    | 1:0, 2:0 |
| 编程        | [1, 3]                    | 1:2, 3:1 |
| Python      | [3]                       | 3:0     |
| 并发        | [1]                       | 1:1     |
| 虚拟        | [2]                       | 2:1     |

搜索 "Java" → 直接定位 Term "Java" → 返回 Posting List [1, 2] → O(1) 级别的查找。这就是倒排索引威力所在。

## Posting List 的详细结构

一个完整的倒排索引条目中，Posting List 不仅存储文档 ID，还包含：

```
Term: "Java"
├── 文档频率 (DF): 2              # 包含该词的文档数
├── Posting List:
│   ├── 文档1:
│   │   ├── 词频 (TF): 1          # 该词在文档1中出现的次数
│   │   └── 位置列表: [0]          # 该词在文档1中的位置（协调查询/高亮用）
│   └── 文档2:
│       ├── 词频 (TF): 1
│       └── 位置列表: [0]
```

这些数据是 ES 评分算法（TF-IDF、BM25）和短语匹配（Match Phrase）、高亮显示的基石。

## ES 倒排索引的三层存储结构

```
查询 "Java"
    ↓
① Term Index（常驻内存，Trie 树/FST 结构）
   "Jaa" → 指向 Term Dictionary 的哪个块
    ↓
② Term Dictionary（磁盘，按 Term 排序，FST 前缀压缩存储）
   "Java" → 找到该 Term 的 Posting List 起始位置
    ↓
③ Posting List（磁盘，跳表 Skip List 结构）
   文档ID: [1, 2, 5, 8, 15, 22, ...] → 返回匹配的文档ID
```

### Term Index — 内存中的 Trie/FST

由于 Term Dictionary 存储在磁盘上，如果每次查询都需要二分查找遍历，性能仍然不够快。Term Index 是 Term Dictionary 的前缀索引，以 **FST（Finite State Transducer，有限状态转换器）** 结构常驻内存。FST 可以高效地共享前缀和后缀，大幅压缩内存占用，同时支持 O(len(prefix)) 的前缀查找 — 比 HashMap 更省内存，比 TreeMap 更快。

```java
// FST 前缀共享示意
"monday"、"monster" → "mon" 共享存储
最终存储可节省 70%-90% 内存
```

### Posting List 的 Skip List 跳表合并

当检索多个词（如 "Java 并发"）时，需要对两个 Posting List 进行**交集合并**。ES 使用 Skip List（跳表）加速合并：

```
Posting List A (Java):     [1, 5, 10, 15, 20, 25, 30, ...]
Skip List 指针:            1 → 10 → 20 → ...

Posting List B (并发):     [3, 5, 8, 15, 22, ...]
Skip list 指针:            3 → 15 → ...

合并过程（交集）:
A指针=1, B指针=3 → A跳跃到10 → A=15, B跳跃到15 → 匹配!
```

跳表的最坏时间复杂度从 O(n + m) 降为 O(n + m)，但真实场景下因为跳跃跳过大量不必要的文档 ID，实际性能要快得多。

## ES vs MySQL LIKE 性能对比

| 维度               | MySQL LIKE '%keyword%'                  | Elasticsearch 倒排索引                |
|--------------------|-----------------------------------------|--------------------------------------|
| 底层原理           | 全表扫描（B+Tree 索引无法匹配前缀通配符 '%'） | 倒排索引直接命中 Term                  |
| 时间复杂度         | O(n) — 扫描所有行                        | O(1) — 直接查找 Term，合并 Posting List |
| 分词               | 无（直接字符串匹配）                       | 支持细粒度分词（IK、jieba）             |
| 相关性评分         | 无                                       | TF-IDF / BM25 算法排名                |
| 高亮               | 需应用层实现                              | 内置高亮 (highlight)                  |
| 聚合分析           | GROUP BY（数据量大时极慢）                 | 列式存储聚合，大数据量毫秒级            |
| 10 万条搜索        | 100-500ms                               | 1-10ms                               |
| 1000 万条搜索      | 数秒甚至超时                              | 10-50ms                              |

**为什么 MySQL 的 LIKE '%keyword%' 无法走索引？** B+Tree 索引是按照字符串的前缀顺序组织的（字典序），`LIKE 'keyword%'` 可以走索引（前缀匹配），但 `LIKE '%keyword%'` 前后都要匹配，B+Tree 无法定位起始位置，只能全表扫描。

## ES 近实时搜索（Near Real-Time）

ES 不是实时搜索的，而是**近实时（NRT）**。写入的数据默认每 **1 秒**（可通过 `index.refresh_interval` 调整）执行一次 `refresh` 操作，将内存中的 segment 刷盘并打开，之后才能被搜索到：

```
写入流程：
Document → Memory Buffer → refresh (默认1s) → Segment (可搜索)
                                              ↓
                                        translog (持久化保证)

提交流程：
refresh → flush (默认30min或translog达到512MB) → commit 到磁盘
```

**refresh 机制**的目的是平衡写入性能和搜索时效性：如果每次写入立即刷盘，磁盘 I/O 压力太大；1 秒的延迟对于大多数场景足够接受。

## IK 中文分词器

ES 默认的标准分词器（Standard Analyzer）按空格和标点分词，对中文完全无效。中文分词需要 **IK 分词器**：

```json
// 创建索引时指定 IK 分词器
{
  "settings": {
    "analysis": {
      "analyzer": {
        "ik_max_word": {
          "type": "ik_max_word"  // 最细粒度切分
        }
      }
    }
  },
  "mappings": {
    "properties": {
      "title": {
        "type": "text",
        "analyzer": "ik_max_word"    // 索引时使用
        "search_analyzer": "ik_smart" // 搜索时使用（粗粒度）
      }
    }
  }
}
```

IK 支持两种模式：

| 模式         | 策略                     | 示例：原子结合               |
|-------------|-------------------------|---------------------------|
| `ik_max_word` | 最细粒度，穷举所有可能的切分 | 原子, 结合, 原子结合           |
| `ik_smart`  | 最粗粒度，保留最合理的结果   | 原子结合                     |

## 面试官追问

**1. ES 写入一条数据的具体流程是什么？**

写入请求到达任意节点（协调节点），该节点根据文档 ID 哈希计算目标分片，将请求转发到主分片所在节点。主分片写入成功后，将请求并行转发到所有副本分片，等待所有副本写入成功后返回客户端确认。写入过程中数据先写入内存 buffer，同时写入 translog（WAL 日志，防止断电丢失），每秒 refresh 使数据可搜索，定期 flush 将 segment 持久化到磁盘并清空 translog。

**2. ES 如何保证高可用？**

通过分片（Shard）和副本（Replica）机制。每个索引被拆分为多个主分片（Primary Shard），每个主分片可以有一个或多个副本分片（Replica Shard）。副本分片与主分片永远不在同一个节点上。当节点宕机时，ES 自动将副本分片提升为主分片，保证数据不丢失、服务不中断。此外，Zen Discovery 协议（ES 7.x 版本）负责集群成员的发现和 Master 选举。
