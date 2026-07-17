---
title: 异常体系
category: java
module: java-io
subcat: roadmap
timeline: false
level: easy
tier: basic
readMinutes: 12
tags: 异常与 IO
summary: "Throwable 体系、checked/unchecked 与 try-catch。"
order: 1
---

- `Throwable` 分为 `Error`（严重，不捕获）与 `Exception`。
- 受检异常（checked）必须处理，运行时异常（RuntimeException）可不处理。
- `try/catch/finally`，`finally` 一定执行（释放资源）。
- `throw` 主动抛，`throws` 声明向上抛。
- 早抛晚捕：底层抛具体异常，上层统一处理。

```java
try {
  int x = 1 / 0;
} catch (ArithmeticException e) {
  System.out.println("除数不能为0");
} finally {
  System.out.println("cleanup");
}
```

**自查清单**
- [ ] 区分 checked/unchecked
- [ ] 会用 try-catch-finally
- [ ] 理解 throw/throws
