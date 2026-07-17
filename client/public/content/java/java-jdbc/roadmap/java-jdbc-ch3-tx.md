---
title: 事务
category: java
module: java-jdbc
subcat: roadmap
timeline: false
level: medium
tier: key
readMinutes: 12
tags: 数据库与 JDBC
summary: ACID、隔离级别与回滚。
order: 4
---

- `conn.setAutoCommit(false)` 开启事务。
- `commit()` 提交，`rollback()` 回滚。
- ACID：原子性/一致性/隔离性/持久性。
- 隔离级别：读未提交→串行化，解决脏读/不可重复读/幻读。
- 异常时务必 rollback，避免脏数据。

**自查清单**
- [ ] 能手动控制事务
- [ ] 理解隔离级别
- [ ] 异常回滚
