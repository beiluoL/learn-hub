---
title: Bean 生命周期
category: java
module: java-spring
subcat: roadmap
timeline: false
level: hard
tier: key
readMinutes: 12
tags: Spring / Boot
summary: 作用域、后置处理器与循环依赖。
order: 2
---

- 作用域：`singleton`（默认）/ `prototype` / Web 作用域。
- 生命周期回调：`@PostConstruct` / `@PreDestroy`。
- `BeanPostProcessor` 干预初始化前后。
- 循环依赖：单例通过三级缓存解决（构造器注入无解）。
- `@Lazy` 延迟初始化打破循环。

**自查清单**
- [ ] 理解作用域
- [ ] 理解生命周期
- [ ] 知道循环依赖处理
