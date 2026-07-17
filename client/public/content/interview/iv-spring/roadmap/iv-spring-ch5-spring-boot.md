---
title: Spring Boot 自动配置
category: interview
module: iv-spring
subcat: roadmap
timeline: false
level: medium
tier: core
readMinutes: 10
tags: "Spring 面试, Spring, Boot"
summary: 起步依赖与条件装配
order: 6
---

- @SpringBootApplication 复合注解
- spring.factories / AutoConfiguration 自动装配
- @Conditional 系列控制装配条件

```java
@SpringBootApplication
public class App {
    public static void main(String[] a) {
        SpringApplication.run(App.class, a);
    }
}
```

> 自动配置按 classpath 条件按需加载。

**自查清单**
- [ ] 能说自动配置
- [ ] 能说条件注解
