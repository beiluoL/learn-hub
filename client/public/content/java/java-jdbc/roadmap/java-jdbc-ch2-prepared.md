---
title: PreparedStatement
category: java
module: java-jdbc
subcat: roadmap
timeline: false
level: medium
tier: core
readMinutes: 12
tags: 数据库与 JDBC
summary: 预编译、防 SQL 注入与批处理。
order: 3
---

- `?` 占位符，参数化查询，性能与安全的双赢。
- 防止 SQL 注入（绝不拼接用户输入）。
- `addBatch/executeBatch` 批量提交。
- `getGeneratedKeys` 取自增主键。
- 设 `fetchSize` 优化大结果集。

**自查清单**
- [ ] 会用占位符
- [ ] 理解防注入
- [ ] 会用批处理
