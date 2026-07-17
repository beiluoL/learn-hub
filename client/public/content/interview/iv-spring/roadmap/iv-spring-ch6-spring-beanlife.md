---
title: Bean 生命周期
category: interview
module: iv-spring
subcat: roadmap
timeline: false
level: hard
tier: extra
readMinutes: 12
tags: "Spring 面试, Spring, 生命周期"
summary: 初始化回调与销毁
order: 7
---

- Aware 接口注入容器资源
- BeanPostProcessor 介入前后处理
- @PostConstruct / DisposableBean

```java
@Component
public class Demo implements InitializingBean {
    @PostConstruct
    void init() { System.out.println("init"); }
    public void afterPropertiesSet() {}
}
```

> BeanPostProcessor 是许多注解功能的基础。

**自查清单**
- [ ] 能说生命周期
- [ ] 能说后置处理器
