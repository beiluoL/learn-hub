---
title: 博客后端 API
category: java
module: java-spring
subcat: cases
timeline: false
level: medium
tier: key
readMinutes: 20
tags: "Spring / Boot, 项目案例"
summary: 用 Spring Boot 实现文章的增删改查 REST 接口 + 统一异常处理。
order: 1
---

- 分层：Controller / Service / Repository。
- `@RestController` 暴露 CRUD。
- `@ControllerAdvice` 统一异常与返回。
- `@Transactional` 包裹写操作。

**自查清单**
- [ ] 分层清晰
- [ ] 接口可运行
- [ ] 异常处理统一
