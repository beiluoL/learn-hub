---
title: IoC 容器
category: interview
module: iv-spring
subcat: roadmap
timeline: false
level: medium
tier: core
readMinutes: 10
tags: "Spring 面试, Spring, IoC"
summary: 容器、BeanFactory 与依赖注入
order: 1
---

- IoC 控制反转，DI 实现依赖注入
- BeanFactory 延迟加载，ApplicationContext 增强
- 注入方式：构造器/setter/字段(@Autowired)

```java
@Configuration
public class AppConfig {
    @Bean
    public UserService userService() {
        return new UserService();
    }
}
```

> 构造器注入利于不可变与测试。

**自查清单**
- [ ] 能说 IoC/DI
- [ ] 能说容器区别
