---
title: MySQL 索引原理：B+ 树、聚簇索引与最左前缀
category: java
level: advanced
readMinutes: 24
tags: "MySQL, 索引, B+树, 最左前缀, 回表"
summary: 从 B+ 树结构讲透聚簇/非聚簇索引、回表与索引失效。
order: 50
prereq: java/java-basics
---

## 为什么数据库索引要用 B+ 树

当我们谈论 MySQL（以最常用的 InnoDB 存储引擎为例）的索引时，本质上是在谈论一棵 **B+ 树**。要理解它，我们先看为什么不是其他结构。

**二叉树的问题**：如果数据有序插入（如 1、2、3、4、5），二叉搜索树会退化成一条链表，查找复杂度退化为 O(n)，并且树的高度会很高，每次访问一个节点都可能意味着一次磁盘 IO。

**B 树（B-Tree）**：是多路平衡查找树，一个节点可以放多个 key，从而让树变得"矮胖"，减少磁盘 IO 次数。但 B 树的每个节点都同时存放索引 key 和整行数据（或非叶子节点也存数据指针），范围查询时需要中序遍历，不够高效。

**B+ 树的优势**（InnoDB 的选择）：
- **非叶子节点只存 key，不存数据**，因此单个节点能容纳更多 key，树更矮胖，三层 B+ 树就能存上千万条数据，查找只需 3 次 IO。
- **所有数据都集中在叶子节点**，并且叶子节点之间用**双向链表**串联，范围查询（如 `WHERE id BETWEEN 10 AND 100`）只需找到起点，顺着链表扫描即可，非常高效。
- **树高度低、查询稳定**，任何一条记录的查找路径长度几乎相同。

所以 InnoDB 用 B+ 树，是为了在"磁盘 IO 次数少"和"范围查询快"之间取得最佳平衡。

## 聚簇索引与二级索引

**聚簇索引（Clustered Index）**：在 InnoDB 中，表数据本身就是按主键顺序组织成一棵 B+ 树的，**叶子节点存放完整的一行数据**。也就是说，主键索引的叶子节点 = 数据行。每张表只能有一个聚簇索引。如果建表时没有显式定义主键，InnoDB 会选择第一个唯一非空索引；如果连唯一索引都没有，会隐式生成一个 6 字节的 row_id 作为聚簇索引。

**二级索引（Secondary Index，也叫非聚簇索引）**：我们手动建的普通索引、唯一索引、联合索引都属于二级索引。它的 B+ 树**叶子节点不存整行数据，而是存"索引列的值 + 主键值"**。

这就引出了"回表"的概念。

## 回表与覆盖索引

当我们用二级索引查询时，流程是：
1. 在二级索引 B+ 树上找到目标 key，拿到对应的**主键值**。
2. 再拿主键回到聚簇索引树去查找完整行数据。

第 2 步就是**回表**。回表意味着额外的 B+ 树查找，会有额外 IO。

**覆盖索引（Covering Index）**：如果查询所需要的列，恰好都包含在二级索引的 key 中，就不需要回表了。例如有联合索引 `(name, age)`，执行 `SELECT name, age FROM user WHERE name = 'Tom'`，索引本身就覆盖了查询列，直接在二级索引树拿到结果即可。

可以在 `EXPLAIN` 的 `Extra` 列看到 `Using index`，就表示走了覆盖索引，性能更好。

## 联合索引与最左前缀原则

**联合索引**是在多个列上建立的索引，例如 `INDEX idx_name_age (name, age)`。它本质也是一棵 B+ 树，但排序规则是先按 `name` 排，name 相同再按 `age` 排（类似"电话簿先按姓排，再按名排"）。

**最左前缀原则**：查询必须从联合索引的最左列开始，并且不能跳过中间列，才能有效利用索引。

- `WHERE name = 'Tom'`：能用索引（用了最左列）。
- `WHERE name = 'Tom' AND age = 20`：能用索引（两列都走）。
- `WHERE age = 20`：**不能**有效用索引（跳过了最左列 name）。
- `WHERE name LIKE 'T%' AND age = 20`：name 走范围，age 在范围后的列无法继续用索引（索引列遇到范围查询会失效后续列）。

所以在设计联合索引时，要把**区分度高的列放在前面**，并且把常用作查询条件的列放在左边。

## 索引下推（ICP）

**索引下推（Index Condition Pushdown）** 是 MySQL 5.6 引入的优化。在没有 ICP 时，使用联合索引 `(name, age)` 查询 `WHERE name LIKE 'T%' AND age = 20`，存储引擎在二级索引上只能先用 `name LIKE 'T%'` 过滤，然后回表把整行交给 Server 层，由 Server 层再用 `age = 20` 过滤。

有了 ICP 后，存储引擎在二级索引上就**顺带把 `age = 20` 这个条件也判断了**，不满足的行直接不回表，从而减少回表次数，提升性能。在 `EXPLAIN` 的 `Extra` 列会显示 `Using index condition`。

## 索引失效的常见场景

即使建了索引，以下情况也会导致索引失效，退化成全表扫描：

- **对索引列使用函数**：`WHERE YEAR(create_time) = 2024`，索引失效。应改写为范围查询 `create_time BETWEEN '2024-01-01' AND '2024-12-31'`。
- **隐式类型转换**：索引列是字符串，却用数字比较 `WHERE phone = 13800000000`（phone 是 varchar），MySQL 会做类型转换导致失效。应写成 `WHERE phone = '13800000000'`。
- **前导模糊查询**：`WHERE name LIKE '%Tom'`，前缀是通配符，无法利用 B+ 树有序性，失效。`LIKE 'Tom%'` 则可以用到最左前缀。
- **使用 OR 连接非索引列**：`WHERE name = 'Tom' OR age = 20`，如果 age 无索引，整条语句可能放弃索引。
- **不等于 / NOT IN / IS NOT NULL**：通常无法走范围索引，容易全表扫描。
- **对索引列做表达式运算**：`WHERE id + 1 = 10` 失效，应改为 `WHERE id = 9`。

## SQL 示例与 EXPLAIN 解读

先建表并插入数据：

```sql
CREATE TABLE `user` (
  `id` BIGINT PRIMARY KEY AUTO_INCREMENT,
  `name` VARCHAR(64) NOT NULL,
  `age` INT NOT NULL,
  `phone` VARCHAR(20),
  KEY `idx_name_age` (`name`, `age`)
) ENGINE=InnoDB;

INSERT INTO `user` (`name`, `age`, `phone`) VALUES
('Tom', 20, '13800000001'),
('Alice', 25, '13800000002'),
('Tom', 30, '13800000003');
```

查看执行计划：

```sql
EXPLAIN SELECT name, age FROM `user` WHERE name = 'Tom' AND age = 20;
```

关键字段解读：
- **key**：实际使用的索引，这里是 `idx_name_age`。
- **type**：访问类型，`ref` 表示非唯一索引等值匹配，性能较好；`const` 最优（主键等值），`ALL` 最差（全表扫描）。
- **rows**：MySQL 估算需要扫描的行数，越小越好。
- **Extra**：`Using index` 表示覆盖索引；`Using where` 表示 Server 层还需过滤；`Using index condition` 表示用了索引下推。

制造一个索引失效的场景并对比：

```sql
-- 走索引：前缀模糊
EXPLAIN SELECT * FROM `user` WHERE name LIKE 'Tom%';

-- 不走索引：函数作用于索引列
EXPLAIN SELECT * FROM `user` WHERE YEAR(age) = 20;
```

## 索引设计建议

- **选择性高的列才建索引**：区分度（不同值数量 / 总行数）越高的列越适合建索引，例如用户 id、手机号；像"性别"这种只有两三个值的列建索引意义不大。
- **避免建过多索引**：索引会占用磁盘空间，并且拖慢 `INSERT/UPDATE/DELETE`（每次写都要维护索引树）。一般单表索引控制在 5 个以内。
- **优先使用覆盖索引**：把经常查询的列放进联合索引，减少回表。
- **联合索引注意顺序**：把区分度高、常用作等值条件的列放最左。
- **长字符串考虑前缀索引**：`INDEX idx_name (name(20))` 只对前 20 个字符建索引，节省空间但无法用于覆盖索引的精确匹配。

## 实际开发中的应用 / 常见问题

**问题一：为什么我建了索引但查询还是慢？**
先用 `EXPLAIN` 看 `key` 是否真的用上了索引，再看 `type` 和 `rows`。常见原因：索引列被函数包裹、发生隐式类型转换、用了前导模糊、或查询返回数据量本身就很大（即使走索引也要回表大量行）。

**问题二：回表到底有多伤？**
如果 `SELECT *` 走二级索引，几乎必然回表。当你只需要少数几列时，把它们纳入联合索引做成覆盖索引，能显著减少 IO。例如列表页只展示 `name, age`，那么 `INDEX (name, age)` 配合 `SELECT name, age` 就是完美覆盖。

**问题三：联合索引顺序怎么定？**
经验法则：等值查询的列放前面，范围查询的列放后面；区分度高的列放前面。例如 `(status, create_time)` 中若 status 只有几种值而 create_time 区分度高，但查询常是 `status = ? AND create_time > ?`，此时把 create_time 放后面更合适，因为范围列后的列不再走索引，把区分度高的放前面反而能让前面的等值条件先大幅缩小范围。
