---
title: 配置中心与链路追踪
category: java
module: java-micro
subcat: roadmap
timeline: false
level: hard
tier: key
readMinutes: 12
tags: 微服务
summary: Nacos Config 与 Sleuth/Zipkin。
order: 6
---

- 配置中心：配置外置、动态刷新，避免重启。
- 链路追踪：TraceId 串联一次请求跨服务调用。
- Sleuth 生成追踪信息，Zipkin 可视化。
- 日志归集（ELK）配合排查。
- 监控告警闭环（Prometheus + Grafana）。

**自查清单**
- [ ] 会用配置中心
- [ ] 理解链路追踪
- [ ] 有可观测体系
