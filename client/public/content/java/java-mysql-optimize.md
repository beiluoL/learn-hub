---
title: MySQL 慢查询与 SQL 优化：EXPLAIN 与分库分表
category: java
level: intermediate
readMinutes: 20
order: 53
tags: "MySQL, 慢查询, EXPLAIN, 优化, 分库分表"
summary: 用 EXPLAIN 分析执行计划并讲解常见 SQL 优化手段。
prereq: java/java-mysql-index
---

## 开启慢查询日志

当系统出现 "接口偶发慢" 时，第一步是**把慢 SQL 抓出来**。MySQL 自带慢查询日志：

```sql
-- 开启慢查询日志
SET GLOBAL slow_query_log = 'ON';
-- 超过 1 秒的查询记为慢查询（生产可调到 0.1~0.5 秒）
SET GLOBAL long_query_time = 1;
-- 记录未使用索引的查询（可选）
SET GLOBAL log_queries_not_using_indexes = 'ON';
```

也可以通过配置文件 `my.cnf` 持久化：

```properties
slow_query_log = 1
slow_query_log_file = /var/log/mysql/slow.log
long_query_time = 1
log_queries_not_using_indexes = 1
```

开启后用 `mysqldumpslow` 工具分析：

```bash
# 按平均执行时间排序，取前 10 条
mysqldumpslow -s at -t 10 /var/log/mysql/slow.log
```

## 用 EXPLAIN 解读执行计划

抓到慢 SQL 后，在前面加 `EXPLAIN` 看 MySQL 怎么执行它：

```sql
EXPLAIN SELECT u.name, o.amount
FROM `user` u JOIN `order` o ON u.id = o.user_id
WHERE u.age > 20 ORDER BY o.amount DESC LIMIT 10;
```

重点关注以下字段：

| 字段 | 含义 | 优化要点 |
| --- | --- | --- |
| select_type | 查询类型 | SIMPLE 最简单；SUBQUERY 子查询；DERIVED 派生表 |
| type | 访问类型 | 从好到差：const > eq_ref > ref > range > index > ALL；目标避免 ALL |
| possible_keys | 可能用到的索引 | 看看有没有候选索引 |
| key | 实际用的索引 | 为空说明没走索引，需优化 |
| rows | 预估扫描行数 | 越小越好 |
| Extra | 额外信息 | Using index（覆盖索引好）；Using filesort（需优化排序）；Using temporary（用了临时表） |

如果 `type = ALL`（全表扫描）或 `Extra` 出现 `Using filesort`/`Using temporary`，通常就是性能瓶颈所在。

## 常见 SQL 优化手段

**避免 SELECT * **：只查需要的列，既能减少网络传输，又有利于**覆盖索引**（见前一篇）。

```sql
-- 不推荐
SELECT * FROM `user` WHERE age > 20;
-- 推荐
SELECT id, name, age FROM `user` WHERE age > 20;
```

**JOIN 优化**：小表驱动大表；关联字段一定要建索引；避免多表 JOIN 或三表以上 JOIN。

**子查询改 JOIN**：MySQL 对 `IN (子查询)` 有时优化不佳，改写成 JOIN 往往更快：

```sql
-- 改写前
SELECT * FROM `order` WHERE user_id IN (SELECT id FROM `user` WHERE age > 20);
-- 改写后
SELECT o.* FROM `order` o JOIN `user` u ON o.user_id = u.id WHERE u.age > 20;
```

**COUNT 优化**：`COUNT(*)` 和 `COUNT(1)` 比 `COUNT(列)` 快（不必判断是否为 NULL）。大表精确计数慢，可用估算 `SHOW TABLE STATUS` 或缓存计数。

**批量操作**：用 `INSERT INTO ... VALUES (...),(...),(...)` 一次插入多行，比循环单条插入快很多。

## 深分页优化

`LIMIT 1000000, 10` 这种深分页非常慢：MySQL 要先排序并丢掉前 100 万行，只取最后 10 行。

```sql
-- 慢：越往后翻越慢
SELECT id, name FROM `user` ORDER BY id LIMIT 1000000, 10;
```

**游标分页（延迟关联 / 书签）**：利用上一页最后一条的 id 作为起点：

```sql
-- 快：用上一页最大 id 作为游标
SELECT id, name FROM `user`
WHERE id > 1000000
ORDER BY id LIMIT 10;
```

或者用覆盖索引先取 id 再回表（延迟关联）：

```sql
SELECT u.id, u.name FROM `user` u
JOIN (SELECT id FROM `user` ORDER BY id LIMIT 1000000, 10) t ON u.id = t.id;
```

## 架构层：读写分离与分库分表

当单机 MySQL 达到瓶颈（连接数、CPU、磁盘 IO），需要从架构上解决。

**读写分离**：一主多从，写走主库，读走从库。用 ShardingSphere、MyCat 或应用层路由实现。注意主从延迟可能导致"刚写就读不到"。

**分库分表**：
- **垂直分表**：把一张宽表按列拆成多张表（如用户基本信息表 + 用户扩展信息表），减少单行体积。
- **水平分表**：按行拆分，如按 `user_id` 取模或按时间范围，把数据分散到多张结构相同的表里。
- **分片键（Sharding Key）**：决定数据落到哪个分片。选高频查询条件做分片键（如 `user_id`），否则会全分片扫描。
- **路由**：应用通过分片算法（取模、范围、哈希）找到目标库表。常用中间件 ShardingSphere-JDBC。

水平分表的代价是跨分片查询、分页、聚合变复杂，能不分就不分，优先用索引、缓存、读写分离。

## 代码示例：深分页优化与覆盖索引

```sql
-- 建一个联合索引，覆盖常用查询列
CREATE INDEX idx_status_ctime ON `order` (status, create_time);

-- 慢：深分页
SELECT * FROM `order` WHERE status = 1 ORDER BY create_time DESC LIMIT 100000, 20;

-- 快：游标分页，上一页最后一条 create_time 已知为 '2024-01-01 10:00:00'
SELECT id, user_id, amount, create_time
FROM `order`
WHERE status = 1 AND create_time < '2024-01-01 10:00:00'
ORDER BY create_time DESC
LIMIT 20;
```

配合覆盖索引 `idx_status_ctime`，查询只扫描索引即可定位并排序，避免回表和 filesort。

## 实际开发中的应用 / 常见问题

**问题一：生产环境能随便加索引优化吗？**
大表加索引会锁表（MySQL 8.0 之前），建议在低峰期或用 `ALGORITHM=INPLACE` 在线 DDL，并先在测试库用真实数据验证 `EXPLAIN`。

**问题二：EXPLAIN 显示走了索引但还是慢？**
可能扫描行数 `rows` 仍然很大，或发生了大量回表、filesort。检查是否覆盖索引、排序字段是否也建了索引。

**问题三：分库分表什么时候做？**
一般单表数据超过 500 万~1000 万行，或单机 CPU/IO 持续高位，再考虑水平分表；不要过早分表，否则复杂度得不偿失。

**问题四：读写分离下读到老数据？**
这是主从延迟。解决方案：对一致性要求高的读走主库；或用半同步复制缩短延迟；或在写入后短暂强制读主库。
