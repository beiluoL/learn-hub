---
title: 网关与路由
category: java
module: java-micro
subcat: roadmap
timeline: false
level: medium
tier: key
readMinutes: 12
tags: 微服务
summary: Spring Cloud Gateway 路由与过滤。
order: 4
---

- 统一入口：路由、鉴权、限流、日志。
- 断言（Predicate）匹配路由，过滤器（Filter）处理请求。
- 网关层做 JWT 校验，下游服务信任内部请求。
- 跨域（CORS）在网关统一处理。
- 避免过度逻辑下沉到网关。

**自查清单**
- [ ] 理解网关职责
- [ ] 会配路由
- [ ] 网关鉴权
