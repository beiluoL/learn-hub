---
title: 异步与并发 (asyncio/多线程/多进程) · 系统学习路线
category: python
module: py-async
subcat: roadmap
timeline: true
level: hard
tier: key
readMinutes: 12
tags: "异步与并发 (asyncio/多线程/多进程), 学习路线, 路线图"
summary: 从总览到逐章拆解的 异步与并发 (asyncio/多线程/多进程) 学习路线，点开任意章节开始学习。
order: 0
---

这份路线把「异步与并发 (asyncio/多线程/多进程)」拆成 7 个阶段，每个阶段给出**核心任务**与**练手目标**。建议边看边敲，每完成一项就勾掉一项。

## 0. 多线程基础

threading 并行 I/O

- [ ] 创建并启动线程
- [ ] 用 join 等待

## 1. 锁与同步

避免竞态条件

- [ ] 用 Lock 保护计数
- [ ] 避免竞态

## 2. 多进程

绕过 GIL 做 CPU 并行

- [ ] 用进程池并行
- [ ] 理解 GIL 突破

## 3. asyncio 协程

async/await 单线程并发

- [ ] 定义协程
- [ ] 用 asyncio.run 运行

## 4. 并发任务编排

gather/create_task

- [ ] 并发运行任务
- [ ] 收集结果

## 5. 异步 I/O 实战

aiohttp/aiomysql

- [ ] 异步请求
- [ ] 理解非阻塞

## 6. 并发模型选型

何时用哪种

- [ ] 能按场景选型
- [ ] 理解模型差异

## 资源与节奏

- 官方文档与权威资料优先；
- 节奏：每天 1~2 小时，理论 + 敲代码交替；
- 关键：每个模块至少完成 1 个可运行的小项目，代码放仓库。
