---
title: Spring MVC 流程
category: interview
module: iv-spring
subcat: roadmap
timeline: false
level: medium
tier: core
readMinutes: 11
tags: "Spring 面试, Spring, MVC"
summary: 请求处理链路与核心组件
order: 5
---

- DispatcherServlet 统一分发
- HandlerMapping/HandlerAdapter/ViewResolver
- 拦截器 vs 过滤器执行顺序

```java
@RestController
public class C {
    @GetMapping("/u/{id}")
    public User get(@PathVariable Long id) {
        return service.find(id);
    }
}
```

> 拦截器基于 Handler，过滤器基于 Servlet。

**自查清单**
- [ ] 能说处理流程
- [ ] 能说拦截器区别
