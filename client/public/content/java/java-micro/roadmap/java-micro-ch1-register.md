---
title: 服务注册发现
category: java
module: java-micro
subcat: roadmap
timeline: false
level: medium
tier: core
readMinutes: 12
tags: 微服务
summary: Nacos/Eureka 实现注册与发现。
order: 2
---

- 服务提供者启动时注册自身到注册中心。
- 消费者从注册中心拉取可用实例列表。
- 心跳保活，下线自动剔除。
- Nacos 兼具注册中心与配置中心。
- 客户端负载均衡（如 Ribbon/Spring Cloud LoadBalancer）。

**自查清单**
- [ ] 理解注册发现
- [ ] 会接 Nacos/Eureka
- [ ] 理解心跳
