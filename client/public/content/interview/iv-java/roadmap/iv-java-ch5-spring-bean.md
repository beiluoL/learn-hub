---
title: Spring Bean 与 IoC
category: interview
module: iv-java
subcat: roadmap
timeline: false
level: medium
tier: key
readMinutes: 10
tags: "Java 面试, Spring, IoC"
summary: Bean 生命周期、作用域与循环依赖
order: 6
---

- IoC：控制反转，容器管理对象创建与依赖注入
- 生命周期：实例化→属性填充→Aware→初始化→可用→销毁
- 作用域：singleton/prototype/request/session
- 三级缓存解决 singleton 循环依赖

```java
@Service
public class UserService {
    @Autowired
    private OrderService orderService; // 依赖注入
}
```

> prototype 多例的循环依赖无法解决，会抛 BeanCurrentlyInCreationException。

**自查清单**
- [ ] 能说生命周期回调
- [ ] 能解释三级缓存
