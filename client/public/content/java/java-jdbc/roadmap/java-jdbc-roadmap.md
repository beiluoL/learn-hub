---
title: 数据库与 JDBC · 系统学习路线
category: java
module: java-jdbc
subcat: roadmap
timeline: true
level: medium
tier: core
readMinutes: 12
tags: "数据库与 JDBC, 学习路线, 路线图"
summary: 从总览到逐章拆解的 数据库与 JDBC 学习路线，点开任意章节开始学习。
order: 0
---

这份路线把「数据库与 JDBC」拆成 6 个阶段，每个阶段给出**核心任务**与**练手目标**。建议边看边敲，每完成一项就勾掉一项。

## 0. SQL 基础

DDL/DML、约束与索引基础。

- [ ] 会写基本 SQL
- [ ] 理解约束
- [ ] 会用 JOIN

## 1. JDBC 入门

DriverManager、Connection 与结果集。

- [ ] 能建立连接
- [ ] 会执行查询
- [ ] 用 try-with-resources

## 2. PreparedStatement

预编译、防 SQL 注入与批处理。

- [ ] 会用占位符
- [ ] 理解防注入
- [ ] 会用批处理

## 3. 事务

ACID、隔离级别与回滚。

- [ ] 能手动控制事务
- [ ] 理解隔离级别
- [ ] 异常回滚

## 4. 连接池

HikariCP/Druid 复用连接。

- [ ] 理解连接池价值
- [ ] 会配 HikariCP
- [ ] 用完归还连接

## 5. 元数据与高级

DatabaseMetaData、分页与存储过程。

- [ ] 会用元数据
- [ ] 会分页优化
- [ ] 会调存储过程

## 资源与节奏

- 官方文档与权威资料优先；
- 节奏：每天 1~2 小时，理论 + 敲代码交替；
- 关键：每个模块至少完成 1 个可运行的小项目，代码放仓库。
