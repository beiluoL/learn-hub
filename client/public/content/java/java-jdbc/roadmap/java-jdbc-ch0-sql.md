---
title: SQL 基础
category: java
module: java-jdbc
subcat: roadmap
timeline: false
level: easy
tier: basic
readMinutes: 12
tags: 数据库与 JDBC
summary: DDL/DML、约束与索引基础。
order: 1
---

- DDL：`CREATE/ALTER/DROP TABLE`，类型与约束。
- DML：`INSERT/UPDATE/DELETE/SELECT`。
- 约束：主键、外键、唯一、非空、默认值。
- `JOIN`：内/左/右连接。
- 索引加速查询但拖慢写入。

```sql
SELECT u.name, o.amount
FROM users u JOIN orders o ON u.id = o.user_id
WHERE o.amount > 100;
```

**自查清单**
- [ ] 会写基本 SQL
- [ ] 理解约束
- [ ] 会用 JOIN
