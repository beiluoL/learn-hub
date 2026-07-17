---
title: 数组与字符串
category: java
module: java-basics
subcat: roadmap
timeline: false
level: easy
tier: core
readMinutes: 12
tags: Java 基础语法
summary: 一维/多维数组，String 不可变性与常用 API。
order: 4
---

- 数组定长：`int[] a = new int[5];` 下标从 0 开始。
- 多维数组本质是「数组的数组」。
- `Arrays.toString / sort / copyOf` 等工具方法。
- String **不可变**：每次拼接都生成新对象，频繁拼接用 `StringBuilder`。
- 常用：`length()`、`charAt`、`substring`、`split`、`equals`。

```java
StringBuilder sb = new StringBuilder();
sb.append("Hello").append(" ").append("World");
String s = sb.toString();
```

**自查清单**
- [ ] 理解数组与多维数组
- [ ] 说清 String 不可变原因
- [ ] 会用 StringBuilder
