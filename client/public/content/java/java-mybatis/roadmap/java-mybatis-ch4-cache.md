---
title: 缓存
category: java
module: java-mybatis
subcat: roadmap
timeline: false
level: hard
tier: key
readMinutes: 12
tags: MyBatis
summary: 一级/二级缓存与配置。
order: 5
---

- 一级缓存：SqlSession 级别，默认开启。
- 二级缓存：Mapper 级别，需开启 `cacheEnabled`。
- 缓存命中条件：相同语句、参数、SqlSession（一级）。
- 分布式环境用 Redis 等外部缓存替代二级。
- 写操作默认清缓存。

**自查清单**
- [ ] 理解一二级缓存
- [ ] 会开启二级缓存
- [ ] 知道分布式局限
