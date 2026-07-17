---
title: 远程调用
category: java
module: java-micro
subcat: roadmap
timeline: false
level: medium
tier: core
readMinutes: 12
tags: 微服务
summary: OpenFeign 声明式调用与 RestTemplate。
order: 3
---

- OpenFeign：接口 + 注解即 HTTP 调用。
- 配合负载均衡选择实例。
- 超时与重试配置。
- 传参与返回值自动序列化（JSON）。
- 异常处理：熔断降级兜底。

```java
@FeignClient(name = "user-service")
public interface UserClient {
  @GetMapping("/users/{id}") UserDTO get(@PathVariable Long id);
}
```

**自查清单**
- [ ] 会用 OpenFeign
- [ ] 理解负载均衡
- [ ] 配置超时
