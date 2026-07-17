---
title: 与 Spring 集成
category: java
module: java-mybatis
subcat: roadmap
timeline: false
level: medium
tier: key
readMinutes: 12
tags: MyBatis
summary: @MapperScan 与事务整合。
order: 6
---

- `@MapperScan` 扫描 Mapper 接口。
- `SqlSessionTemplate` 管理会话生命周期。
- 与 Spring 事务联动（`@Transactional`）。
- 多数据源：指定不同 `SqlSessionFactory`。
- PageHelper 等插件分页。

**自查清单**
- [ ] 会 @MapperScan
- [ ] 整合事务
- [ ] 了解多数据源
