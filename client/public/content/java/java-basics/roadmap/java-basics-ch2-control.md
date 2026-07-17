---
title: 运算符与流程控制
category: java
module: java-basics
subcat: roadmap
timeline: false
level: easy
tier: core
readMinutes: 12
tags: Java 基础语法
summary: 算术/关系/逻辑运算符，if/switch 与三种循环。
order: 3
---

- 算术 `+ - * / %`、自增 `i++` vs `++i`。
- 关系 `> < == !=`、逻辑 `&& || !`（短路求值）。
- 三元运算符 `cond ? a : b`。
- `if/else`、`switch`（Java 14+ 支持箭头表达式）。
- `for` / `while` / `do-while`，`break` / `continue`。

```java
for (int i = 0; i < 5; i++) {
  if (i % 2 == 0) continue;
  System.out.println(i);
}
```

**自查清单**
- [ ] 能用三种循环实现遍历
- [ ] 理解短路逻辑
- [ ] 掌握 switch 新语法
