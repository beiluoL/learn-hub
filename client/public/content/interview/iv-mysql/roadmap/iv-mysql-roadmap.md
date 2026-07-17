---
title: MySQL 面试 · 系统学习路线
category: interview
module: iv-mysql
subcat: roadmap
timeline: true
level: hard
tier: key
readMinutes: 12
tags: "MySQL 面试, 学习路线, 路线图"
summary: 从总览到逐章拆解的 MySQL 面试 学习路线，点开任意章节开始学习。
order: 0
---

这份路线把「MySQL 面试」拆成 7 个阶段，每个阶段给出**核心任务**与**练手目标**。建议边看边敲，每完成一项就勾掉一项。

## 0. 索引原理

B+ 树、聚簇索引与最左前缀

- [ ] 能说 B+ 树
- [ ] 能说最左前缀

## 1. 事务与隔离级别

ACID 与脏读/不可重复读/幻读

- [ ] 能说四个级别
- [ ] 能说 MVCC

## 2. 锁机制

行锁、间隙锁与 Next-Key Lock

- [ ] 能说三类锁
- [ ] 能说死锁处理

## 3. 慢查询优化

执行计划与优化思路

- [ ] 会读 EXPLAIN
- [ ] 能优化慢 SQL

## 4. 日志与 binlog

redo/undo/binlog 与两阶段提交

- [ ] 能说三类日志
- [ ] 能说两阶段提交

## 5. 存储引擎

InnoDB 与 MyISAM 对比

- [ ] 能对比引擎
- [ ] 能选引擎

## 6. 表设计与范式

三大范式与反范式权衡

- [ ] 能说范式
- [ ] 能做权衡

## 资源与节奏

- 官方文档与权威资料优先；
- 节奏：每天 1~2 小时，理论 + 敲代码交替；
- 关键：每个模块至少完成 1 个可运行的小项目，代码放仓库。
