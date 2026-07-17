---
title: 接口与抽象类
category: java
module: java-oop
subcat: roadmap
timeline: false
level: medium
tier: key
readMinutes: 12
tags: 面向对象
summary: interface 定义契约，支持默认方法与多实现。
order: 5
---

- 接口只有抽象方法（Java 8+ 可有 `default`/`static`）。
- 类可实现多个接口：`class A implements B, C`。
- 函数式接口（单一抽象方法）可用 Lambda。
- 接口用于定义「能做什么」，抽象类用于「是什么」。
- 优先面向接口设计。

```java
@FunctionalInterface
interface Greet { void say(String name); }
Greet g = name -> System.out.println("hi " + name);
```

**自查清单**
- [ ] 能定义并实现接口
- [ ] 理解函数式接口
- [ ] 区分接口与抽象类
