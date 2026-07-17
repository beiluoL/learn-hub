---
title: 方法与方法重载
category: java
module: java-basics
subcat: roadmap
timeline: false
level: medium
tier: core
readMinutes: 12
tags: Java 基础语法
summary: 方法定义、参数传递、重载与递归。
order: 5
---

- 方法签名：返回类型 + 方法名 + 参数列表。
- Java 只有**值传递**：基本类型传副本，引用类型传地址副本。
- 重载（overload）：同名不同参数列表，与返回类型无关。
- 可变参数 `void f(int... nums)`。
- 递归：自己调用自己，必须有终止条件。

```java
int sum(int... nums) {
  int s = 0; for (int n : nums) s += n; return s;
}
```

**自查清单**
- [ ] 理解值传递本质
- [ ] 能写出方法重载
- [ ] 写过递归（如阶乘）
