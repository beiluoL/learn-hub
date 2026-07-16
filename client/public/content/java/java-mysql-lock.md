---
title: MySQL 锁机制：行锁、间隙锁、临键锁与死锁
category: java
level: advanced
readMinutes: 20
order: 52
tags: "MySQL, 锁, 行锁, 间隙锁, 死锁"
summary: 剖析 InnoDB 行锁、Next-Key 锁与死锁排查。
prereq: java/java-mysql-transaction
---

## MyISAM 表锁与 InnoDB 行锁

**MyISAM** 只支持**表级锁**：只要对表做写操作（`UPDATE/DELETE/INSERT`），就会锁住整张表，其他读写都要排队，并发性能差。它读时加共享锁，写时加排他锁。

**InnoDB** 支持**行级锁**：默认情况下，写操作只锁住受影响的行，其他行不受影响，并发度高。但注意：InnoDB 的行锁是**锁在索引上的**，如果查询没有命中索引（或索引失效），行锁会升级为锁住所有行（等价于锁全表）。这是很多人踩坑的地方。

InnoDB 还支持**表级意向锁**，它是一种"声明"：事务在给某行加锁前，会先给整张表加一个意向锁（IS 共享意向锁 / IX 排他意向锁）。意向锁之间兼容，但和表级 S/X 锁互斥，目的是让表锁能快速判断"表里是否已有行被锁"，避免逐行扫描。

## InnoDB 行锁的几种类型

InnoDB 在 RR 隔离级别（默认）下，行锁实际上由三类组成：

- **记录锁（Record Lock）**：锁住某一条具体的索引记录。例如 `UPDATE user SET age=20 WHERE id=5`，锁住 id=5 这一行。
- **间隙锁（Gap Lock）**：锁住两条记录之间的"间隙"，防止其他事务往这个间隙插入新数据。它锁的是范围，不锁具体记录，因此**多个事务可以同时持有同一间隙的间隙锁**（因为目的是防插入，不冲突）。
- **临键锁（Next-Key Lock）**：等于**记录锁 + 间隙锁**，锁住某条记录及其前面的间隙。它是 InnoDB 在 RR 级别下的默认行锁算法，用来**防止幻读**。例如索引值有 10、20、30，Next-Key Lock 会锁 (10,20]、(20,30] 这样的左开右闭区间。

在 RC 隔离级别下，InnoDB 会**禁用间隙锁**（除了外键约束和唯一性检查），所以 RC 下只锁命中行，更容易出现幻读，但并发冲突更少。

## 锁与索引的关系

务必记住：**InnoDB 锁的是索引记录，不是数据行本身**。下面两种情况的后果完全不同：

```sql
-- 有索引：只锁 id=5 这一行
UPDATE user SET age = 20 WHERE id = 5;

-- 无索引（假设 name 没建索引）：InnoDB 会全表扫描，
-- 实际上会锁住所有扫描到的行，等价于锁全表！
UPDATE user SET age = 20 WHERE name = 'Tom';
```

所以在写 `UPDATE/DELETE` 时，WHERE 条件一定要命中索引，否则在高并发下会拖垮整张表。

## 死锁成因与排查

**死锁**是指两个或多个事务互相持有对方需要的锁，并且都在等待对方释放，形成循环等待。例如：

- 事务 A 锁住行 1，想锁行 2；
- 事务 B 锁住行 2，想锁行 1；
- 互相等待，死锁。

InnoDB 有死锁检测机制（`innodb_deadlock_detect = ON`），发现死锁后会**选择一个代价小的事务回滚**，并抛出 `ERROR 1213 (40001): Deadlock found`。

排查死锁要查看 InnoDB 的状态：

```sql
-- 查看最近一次死锁的详细信息（含两个事务各自持有的锁和等待的锁）
SHOW ENGINE INNODB STATUS;
```

输出中 `LATEST DETECTED DEADLOCK` 段落会列出死锁双方的事务、SQL、持有的锁（HOLDS THE LOCK）和等待的锁（WAITING FOR THE LOCK）。InnoDB 内部还维护一张**等待图（wait-for graph）**，通过检测图中是否存在环来判定死锁。

此外，还有 `performance_schema.data_lock_waits` 和 `data_locks` 两张表可以实时查看当前锁等待情况：

```sql
SELECT * FROM performance_schema.data_lock_waits;
SELECT * FROM performance_schema.data_locks;
```

## 如何避免死锁

- **固定加锁顺序**：所有事务都按相同的顺序访问资源（如永远先锁 id 小的行再锁 id 大的行），就不会形成循环等待。
- **缩短事务**：事务越短，持有锁的时间越短，冲突概率越低。不要在事务里做远程调用、文件 IO。
- **降低隔离级别**：从 RR 降到 RC 可以避免间隙锁（在不需要防幻读的场景下），减少锁范围。
- **为查询建好索引**：避免锁升级为全表锁。
- **合理设置超时**：`innodb_lock_wait_timeout`（默认 50 秒）控制锁等待超时，超时会自动回滚等待方。

## 代码示例：制造死锁

打开两个 MySQL 连接（A 和 B），按如下顺序执行即可制造死锁（假设 user 表有 id 为 1 和 2 的两行）：

**连接 A**：

```sql
START TRANSACTION;
UPDATE user SET age = 20 WHERE id = 1;   -- 锁住 id=1
-- 暂停，等待连接 B 执行
UPDATE user SET age = 21 WHERE id = 2;   -- 此时会检测到死锁，被回滚
```

**连接 B**（在 A 暂停期间执行）：

```sql
START TRANSACTION;
UPDATE user SET age = 30 WHERE id = 2;   -- 锁住 id=2
UPDATE user SET age = 31 WHERE id = 1;   -- 等待 A 释放 id=1，与 A 形成循环等待
```

当连接 B 执行第二条语句时，InnoDB 检测到 A、B 互相等待，于是让其中一个事务回滚并报死锁错误。这正是典型的"交叉更新"死锁。

## 实际开发中的应用 / 常见问题

**问题一：UPDATE 一条数据，整个接口都卡住了？**
大概率是这条 UPDATE 的 WHERE 没走索引，行锁退化成锁全表，所有访问该表的写操作都阻塞。用 `EXPLAIN` 确认是否走索引，必要时补索引。

**问题二：为什么 RR 下偶尔还是报死锁？**
RR 的 Next-Key Lock 加锁范围更大（含间隙），反而比 RC 更容易在并发插入/更新时出现锁等待和死锁。如果业务能接受 RC 的语义，可以考虑降级。

**问题三：批量更新如何避免死锁？**
对要批量更新的主键集合，先在应用层排序（如按 id 升序），让所有事务按相同顺序加锁，从根本上消除循环等待。

**问题四：死锁回滚了怎么办？**
死锁被回滚的事务会收到异常，应用层应**重试**（通常重试 2~3 次即可成功）。这是处理死锁的标准做法，不要把它当成严重故障。
