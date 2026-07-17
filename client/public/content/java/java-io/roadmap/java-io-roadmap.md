---
title: 异常与 IO · 系统学习路线
category: java
module: java-io
subcat: roadmap
timeline: true
level: medium
tier: core
readMinutes: 12
tags: "异常与 IO, 学习路线, 路线图"
summary: 从总览到逐章拆解的 异常与 IO 学习路线，点开任意章节开始学习。
order: 0
---

这份路线把「异常与 IO」拆成 6 个阶段，每个阶段给出**核心任务**与**练手目标**。建议边看边敲，每完成一项就勾掉一项。

## 0. 异常体系

Throwable 体系、checked/unchecked 与 try-catch。

- [ ] 区分 checked/unchecked
- [ ] 会用 try-catch-finally
- [ ] 理解 throw/throws

## 1. 自定义异常

定义业务异常并保留异常链。

- [ ] 能定义自定义异常
- [ ] 保留异常链
- [ ] 合理选择受检/非受检

## 2. File 与 Path

文件/目录操作与 NIO.2 的 Path/Files。

- [ ] 会用 File/Path
- [ ] 能读写文本文件
- [ ] 会递归遍历目录

## 3. 字节流与字符流

InputStream/Reader 体系与缓冲流。

- [ ] 区分字节/字符流
- [ ] 会用缓冲流
- [ ] 用 try-with-resources

## 4. NIO 新特性

Channel/Buffer 与 Files 新 API。

- [ ] 理解 Channel/Buffer
- [ ] 会用 Files 新 API
- [ ] 了解内存映射

## 5. 序列化

对象序列化与反序列化、transient 控制。

- [ ] 理解序列化用途
- [ ] 会用 transient
- [ ] 知道 serialVersionUID

## 资源与节奏

- 官方文档与权威资料优先；
- 节奏：每天 1~2 小时，理论 + 敲代码交替；
- 关键：每个模块至少完成 1 个可运行的小项目，代码放仓库。
