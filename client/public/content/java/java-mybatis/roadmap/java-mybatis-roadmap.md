---
title: MyBatis · 系统学习路线
category: java
module: java-mybatis
subcat: roadmap
timeline: true
level: medium
tier: key
readMinutes: 12
tags: "MyBatis, 学习路线, 路线图"
summary: 从总览到逐章拆解的 MyBatis 学习路线，点开任意章节开始学习。
order: 0
---

这份路线把「MyBatis」拆成 6 个阶段，每个阶段给出**核心任务**与**练手目标**。建议边看边敲，每完成一项就勾掉一项。

## 0. 入门与配置

SqlSessionFactory、映射文件与 Mapper 接口。

- [ ] 理解核心对象
- [ ] 能配 SqlSessionFactory
- [ ] 区分 # 与 $

## 1. CRUD 映射

select/insert/update/delete 与参数。

- [ ] 会写 CRUD
- [ ] 会取主键
- [ ] 会用 @Param

## 2. 动态 SQL

if/choose/foreach/where/trim/set。

- [ ] 会用 if/foreach
- [ ] 理解 where 标签
- [ ] 能写动态查询

## 3. 结果映射

resultMap、关联与延迟加载。

- [ ] 会用 resultMap
- [ ] 理解 association/collection
- [ ] 了解延迟加载

## 4. 缓存

一级/二级缓存与配置。

- [ ] 理解一二级缓存
- [ ] 会开启二级缓存
- [ ] 知道分布式局限

## 5. 与 Spring 集成

@MapperScan 与事务整合。

- [ ] 会 @MapperScan
- [ ] 整合事务
- [ ] 了解多数据源

## 资源与节奏

- 官方文档与权威资料优先；
- 节奏：每天 1~2 小时，理论 + 敲代码交替；
- 关键：每个模块至少完成 1 个可运行的小项目，代码放仓库。
