---
question: MySQL 索引为什么选用 B+ 树？哪些场景下索引会失效？
category: java
difficulty: middle
tags: "MySQL, B+树, 索引失效, 最左前缀"
order: 22
---

## 核心结论

**回答**：MySQL InnoDB 选择 B+ 树的根本原因是磁盘 IO 特性——B+ 树矮胖、非叶子节点只存索引不存数据，单次查询的 IO 次数等于树高度（3 层可存千万级数据）；叶子节点通过双向链表连接，天然支持范围查询。索引失效的根因是"破坏了索引的有序性"，最左前缀原则是理解索引是否生效的核心准则。

## 为什么是 B+ 树

### 对比主流数据结构

| 数据结构 | 查询性能 | 范围查询 | 插入性能 | IO 次数 | 适用场景 |
|----------|----------|----------|----------|---------|----------|
| 哈希表 | O(1) | 不支持 | O(1) | 1 | 等值查询（Memory 引擎） |
| 二叉树 | O(logN) | 支持 | O(logN) | 树高度 | 内存数据集 |
| 红黑树 | O(logN) | 支持 | O(logN) | 树高度 | 内存数据集 |
| B 树 | O(logN) | 支持 | O(logN) | ~3-4 | 磁盘存储 |
| B+ 树 | O(logN) | 极优 | O(logN) | ~2-3 | 磁盘存储 |

### B+ 树的三大优势

**1. 矮胖高扇出**：非叶子节点只存键值不存数据。假设一个节点 16KB（InnoDB 一页大小），一条索引记录 14 字节（bigint 8 字节 + 指针 6 字节），一个节点可存约 1170 条索引记录。3 层 B+ 树可存储：1170 * 1170 * 16 ≈ 2000 万行数据。只需要 3 次 IO。

```bash
# 估算：主键 bigint(8字节) + 页号指针(6字节) = 14字节/条
# 一页 16KB = 16384 字节
# 非叶子节点：16384 / 14 ≈ 1170 条
# 叶子节点：16384 / 1KB(一行) ≈ 16 条
# 三层：1170 * 1170 * 16 ≈ 2100 万
```

**2. 叶子节点链表**：所有叶子节点按键值排序并通过双向链表连接（`prev` / `next` 指针），范围查询只需定位到起点然后沿链表扫描即可，无需回退非叶子层。

```sql
-- B+ 树完美适配：找到第一个 ≥ 100 的叶子节点，沿链表向右读取
SELECT * FROM orders WHERE id BETWEEN 100 AND 500;
```

**3. 查询稳定性**：所有数据都在叶子节点，查询任意记录经历的 IO 次数一致（等于树高度），不会出现 B 树中非叶子节点直接命中的"快慢不均"。

### 聚簇索引 vs 二级索引（回表）

```sql
-- 表结构
CREATE TABLE users (
    id INT PRIMARY KEY,
    name VARCHAR(50),
    age INT,
    KEY idx_name (name)
);

-- 聚簇索引(id)：B+ 树叶子节点存的是整行数据
-- 二级索引(name)：B+ 树叶子节点存的是主键 id
-- 回表：先查二级索引拿到 id，再查聚簇索引拿整行数据
```

**覆盖索引**：如果查询列全在索引中，不需要回表，Extra 显示 `Using index`：

```sql
-- 仅从 idx_name 索引树即可获取所需数据，无需回表
SELECT id, name FROM users WHERE name = '张三';
-- Extra: Using index

-- 需要回表：age 不在 idx_name 索引中
SELECT * FROM users WHERE name = '张三';
-- Extra: NULL（或 Using index condition）
```

## 最左前缀原则

联合索引 (a, b, c) 按照 a → b → c 的顺序排序。**只有查询条件从 a 开头且不离散中断，索引才能被利用**。

```sql
CREATE INDEX idx_abc ON t(a, b, c);

-- 走索引
SELECT * FROM t WHERE a = 1;                      -- 走 a
SELECT * FROM t WHERE a = 1 AND b = 2;            -- 走 a, b
SELECT * FROM t WHERE a = 1 AND b = 2 AND c = 3;  -- 走全部
SELECT * FROM t WHERE a = 1 AND b > 2 AND c = 3;  -- 走 a, b（c 范围后失效）

-- 不走索引或部分走
SELECT * FROM t WHERE b = 2;                      -- 不走，没有 a
SELECT * FROM t WHERE b = 2 AND c = 3;            -- 不走，没有 a
SELECT * FROM t WHERE a = 1 AND c = 3;            -- 只走 a，c 失效（b 中断）
```

**为什么 a = 1 AND c = 3 只走 a？** 联合索引的 B+ 树先按 a 排序，a 相同才按 b 排序，b 相同才按 c 排序。b 条件缺失时，在已定位的 a=1 区域内 c 不是有序的，无法继续使用二分查找。

## 索引失效的 8 大场景

| 场景 | 失效原因 | 示例 |
|------|----------|------|
| 1. 对索引列使用函数 | 破坏索引列原始值，无法在 B+ 树上定位 | `WHERE DATE(create_time) = '2024-01-01'` |
| 2. 隐式类型转换 | 字符串列用数字查询，索引失效 | `WHERE phone = 13800138000`（phone 是 varchar） |
| 3. 前导模糊 LIKE | 以 % 开头，B+ 树无法定位起点 | `WHERE name LIKE '%三'` |
| 4. OR 连接非索引列 | 优化器会选择全表扫描 | `WHERE id = 1 OR name = '张三'`（name 无索引） |
| 5. 不等于（!=, <>） | 范围太大，优化器放弃索引 | `WHERE status != 0` |
| 6. 索引列上计算/表达式 | 同函数失效 | `WHERE age + 1 = 18` |
| 7. IS NULL / IS NOT NULL | 视数据分布，NULL 值较多时可能不失效 | `WHERE name IS NULL` |
| 8. NOT IN / NOT EXISTS | 多数情况全表扫描 | `WHERE id NOT IN (SELECT ...)` |

### EXPLAIN 重点关注字段

```sql
EXPLAIN SELECT * FROM orders WHERE user_id = 1001;
```

| 字段 | 含义 | 良好信号 | 问题信号 |
|------|------|----------|----------|
| key | 实际使用的索引 | 有值 | NULL（全表扫描） |
| type | 访问类型 | const / eq_ref / ref / range | ALL / index |
| rows | 预估扫描行数 | 接近实际返回行数 | 几十万 |
| Extra | 额外信息 | Using index（覆盖索引） | Using filesort / Using temporary |

## 面试追问

1. **联合索引 (a,b,c)，WHERE a = 1 AND c > 3 走哪些？** 走 a，范围查询 b 未指定导致 c 的有序性丧失。MySQL 会做 ICP（Index Condition Pushdown）优化，在索引层面先过滤 c > 3 减少回表，但 key_len 显示只用到 a。

2. **LIKE 'abc%' 走索引吗？** 走，因为前缀匹配不破坏有序性，B+ 树可以定位到 abc 开头的第一个叶子节点。只有 `%abc` 或 `%abc%` 不走索引。

3. **分页查询 LIMIT 100000,10 为什么慢？如何优化？** 需要扫描前 100010 行再丢掉前 100000 行。优化方案：延迟关联（先查主键再回表）、使用覆盖索引+子查询、记下上次的最大 id 用 WHERE id > lastId LIMIT 10。

4. **能为了用上索引而强制建一个很长的联合索引吗？** 不建议。索引需要维护成本（INSERT/UPDATE/DELETE 时更新）、占用磁盘空间和内存（Buffer Pool）。一般 3~5 列为宜，根据业务查询频率选择性建索引。
