---
title: 循环依赖
category: interview
module: iv-spring
subcat: roadmap
timeline: false
level: hard
tier: key
readMinutes: 12
tags: "Spring 面试, Spring, 循环依赖"
summary: 三级缓存与解决机制
order: 3
---

- 三级缓存：单例池/早期曝光/工厂
- 提前曝光半成品 bean 打破循环
- 构造器注入无法解决循环依赖

```java
@Service
public class A { @Autowired private B b; }
@Service
public class B { @Autowired private A a; }
// 字段注入可经三级缓存解决
```

> singleton 字段/setter 循环可解，prototype 不可。

**自查清单**
- [ ] 能说三级缓存
- [ ] 能说限制
