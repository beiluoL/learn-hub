---
title: Web 开发
category: java
module: java-spring
subcat: roadmap
timeline: false
level: medium
tier: core
readMinutes: 12
tags: Spring / Boot
summary: REST 接口、参数绑定与统一处理。
order: 5
---

- `@RestController` + `@RequestMapping` 暴露接口。
- `@PathVariable` / `@RequestParam` / `@RequestBody` 绑参。
- 统一返回包装与全局异常处理（`@ControllerAdvice`）。
- 参数校验：`@Valid` + 约束注解。
- 拦截器/过滤器处理鉴权、日志。

```java
@GetMapping("/users/{id}")
public UserDTO get(@PathVariable Long id) { return service.findById(id); }
```

**自查清单**
- [ ] 能写 REST 接口
- [ ] 会参数绑定
- [ ] 统一异常处理
