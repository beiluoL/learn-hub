---
title: 微服务 · 系统学习路线
category: java
module: java-micro
subcat: roadmap
timeline: true
level: hard
tier: key
readMinutes: 12
tags: "微服务, 学习路线, 路线图"
summary: 从总览到逐章拆解的 微服务 学习路线，点开任意章节开始学习。
order: 0
---

这份路线把「微服务」拆成 6 个阶段，每个阶段给出**核心任务**与**练手目标**。建议边看边敲，每完成一项就勾掉一项。

## 0. 微服务概览

服务拆分、注册中心、网关与利弊。

- [ ] 理解拆分动机
- [ ] 知道核心组件
- [ ] 权衡利弊

## 1. 服务注册发现

Nacos/Eureka 实现注册与发现。

- [ ] 理解注册发现
- [ ] 会接 Nacos/Eureka
- [ ] 理解心跳

## 2. 远程调用

OpenFeign 声明式调用与 RestTemplate。

- [ ] 会用 OpenFeign
- [ ] 理解负载均衡
- [ ] 配置超时

## 3. 网关与路由

Spring Cloud Gateway 路由与过滤。

- [ ] 理解网关职责
- [ ] 会配路由
- [ ] 网关鉴权

## 4. 熔断与限流

Resilience4j/Sentinel 保障可用性。

- [ ] 理解熔断
- [ ] 会用限流
- [ ] 会降级兜底

## 5. 配置中心与链路追踪

Nacos Config 与 Sleuth/Zipkin。

- [ ] 会用配置中心
- [ ] 理解链路追踪
- [ ] 有可观测体系

## 资源与节奏

- 官方文档与权威资料优先；
- 节奏：每天 1~2 小时，理论 + 敲代码交替；
- 关键：每个模块至少完成 1 个可运行的小项目，代码放仓库。
