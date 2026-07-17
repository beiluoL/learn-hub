---
title: IoC 与 DI
category: java
module: java-spring
subcat: roadmap
timeline: false
level: medium
tier: core
readMinutes: 12
tags: Spring / Boot
summary: 控制反转、依赖注入与 Bean 定义。
order: 1
---

- IoC：对象创建交给容器，解耦。
- DI：容器把依赖注入到组件（构造器/setter/字段）。
- `@Component`/`@Service`/`@Repository` 注册 Bean。
- `@Autowired` 注入（`@Resource` 也可）。
- 推荐构造器注入，不可变且易测。

```java
@Service
public class UserService {
  private final UserRepo repo;
  public UserService(UserRepo repo) { this.repo = repo; }
}
```

**自查清单**
- [ ] 理解 IoC/DI
- [ ] 会用注解注册 Bean
- [ ] 用构造器注入
