---
title: 类加载机制
category: java
module: java-jvm
subcat: roadmap
timeline: false
level: hard
tier: key
readMinutes: 12
tags: JVM 与调优
summary: 双亲委派与自定义类加载器。
order: 4
---

- 加载→链接（验证/准备/解析）→初始化。
- 双亲委派：先委托父加载器，保证安全与唯一。
- 破坏双亲委派：SPI、热部署、Tomcat。
- 自定义 ClassLoader 实现隔离/加密加载。
- `ClassNotFoundException` vs `NoClassDefFoundError`。

**自查清单**
- [ ] 说清加载流程
- [ ] 理解双亲委派
- [ ] 能自定义加载器
