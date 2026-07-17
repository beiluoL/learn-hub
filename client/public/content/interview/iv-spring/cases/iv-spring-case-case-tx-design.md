---
title: 设计多数据源事务方案
category: interview
module: iv-spring
subcat: cases
timeline: false
level: hard
tier: key
readMinutes: 16
tags: "Spring 面试, 项目案例"
summary: 本地事务局限与分布式事务取舍
order: 1
---

- 单库用 @Transactional 即可
- 多库考虑 2PC/TCC/最终一致(消息)
- Seata AT 模式无侵入

```java
@Transactional
public void transfer() {
    accountMapper.debit();   // 库A
    // 跨库需分布式事务
    orderMapper.create();    // 库B
}
```

**自查清单**
- [ ] 能识别跨库
- [ ] 能说方案
