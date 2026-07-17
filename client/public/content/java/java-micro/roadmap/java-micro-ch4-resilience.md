---
title: 熔断与限流
category: java
module: java-micro
subcat: roadmap
timeline: false
level: hard
tier: key
readMinutes: 12
tags: 微服务
summary: Resilience4j/Sentinel 保障可用性。
order: 5
---

- 熔断器：失败率超阈值则打开，快速失败。
- 限流：令牌桶/漏桶控制 QPS。
- 舱壁隔离：限制并发资源。
- 降级：异常时返回兜底数据。
- Sentinel 提供可视化规则与热点限流。

**自查清单**
- [ ] 理解熔断
- [ ] 会用限流
- [ ] 会降级兜底
