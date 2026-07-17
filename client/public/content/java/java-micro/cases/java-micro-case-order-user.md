---
title: 订单-用户 微服务
category: java
module: java-micro
subcat: cases
timeline: false
level: hard
tier: key
readMinutes: 20
tags: "微服务, 项目案例"
summary: 拆分订单服务与用户服务，经注册中心 + Feign 调用 + 网关路由。
order: 1
---

- 两个独立 Spring Boot 服务。
- Nacos 注册发现。
- 订单服务通过 Feign 调用户服务。
- Gateway 统一入口并鉴权。

**自查清单**
- [ ] 服务可独立启动
- [ ] Feign 调用通
- [ ] 网关路由通
