---
title: 自定义异常
category: java
module: java-io
subcat: roadmap
timeline: false
level: medium
tier: core
readMinutes: 12
tags: 异常与 IO
summary: 定义业务异常并保留异常链。
order: 2
---

- 继承 `Exception`（受检）或 `RuntimeException`（非受检）。
- 提供带 message 与 cause 的构造器。
- 用异常表达业务错误，而非返回错误码。
- 异常链：`new MyException("x", e)` 保留根因。
- 异常类名以 Exception 结尾，语义清晰。

**自查清单**
- [ ] 能定义自定义异常
- [ ] 保留异常链
- [ ] 合理选择受检/非受检
