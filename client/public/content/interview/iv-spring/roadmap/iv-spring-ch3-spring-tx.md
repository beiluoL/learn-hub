---
title: 事务传播
category: interview
module: iv-spring
subcat: roadmap
timeline: false
level: hard
tier: key
readMinutes: 13
tags: "Spring 面试, Spring, 事务"
summary: 七种传播行为与失效场景
order: 4
---

- REQUIRED/REQUIRES_NEW/NESTED 等七种
- 同类方法调用事务不生效(代理未介入)
- RuntimeException 默认回滚

```java
@Transactional(propagation = Propagation.REQUIRES_NEW)
public void audit() { /* 新事务 */ }

@Transactional
public void pay() { audit(); } // 同类调用不生效
```

> 事务方法须是 public 且经代理调用。

**自查清单**
- [ ] 能说传播行为
- [ ] 能说失效场景
