---
title: 连接池
category: java
module: java-jdbc
subcat: roadmap
timeline: false
level: medium
tier: key
readMinutes: 12
tags: 数据库与 JDBC
summary: HikariCP/Druid 复用连接。
order: 5
---

- 频繁建连开销大，连接池复用连接。
- HikariCP：高性能默认选择。
- Druid：带监控与防注入。
- 关键参数：最大/最小连接数、超时。
- 从池取连接，用完归还（close 实为归还）。

**自查清单**
- [ ] 理解连接池价值
- [ ] 会配 HikariCP
- [ ] 用完归还连接
