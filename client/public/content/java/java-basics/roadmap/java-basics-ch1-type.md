---
title: 变量与数据类型
category: java
module: java-basics
subcat: roadmap
timeline: false
level: easy
tier: basic
readMinutes: 12
tags: Java 基础语法
summary: 掌握 8 种基本类型、引用类型与类型转换。
order: 2
---

- 基本类型：byte/short/int/long、float/double、char、boolean。
- 引用类型：类、接口、数组、枚举等（存的是地址）。
- 自动类型提升与强制转换：`(int)3.14`、`long n = 100L`。
- `final` 修饰常量，命名常用全大写。
- 包装类（Integer/Double）提供对象能力与自动装箱拆箱。

```java
final double PI = 3.14159;
int a = 10; long b = a;        // 自动提升
double c = (double) a / 3; // 强制转换
```

**自查清单**
- [ ] 能区分基本类型与引用类型
- [ ] 熟练使用强制/自动转换
- [ ] 理解 final 语义
