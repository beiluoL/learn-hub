---
title: Java 基础语法与数据类型
category: java
level: beginner
readMinutes: 12
tags: "基础, 数据类型, 变量"
summary: 掌握 Java 的基本类型、引用类型、运算符与控制流，搭建扎实的语法基础。
order: 1
---

## 一、基础类型（Primitive Types）

Java 有 8 种基础类型，直接存储值，性能高：

-   **整数**：byte(8)、short(16)、**int(32)**、long(64)
-   **浮点**：float(32)、**double(64)**
-   **字符**：char(16，UTF-16)
-   **布尔**：boolean（true / false）

```
int age = 18;
double price = 9.9;
boolean active = true;
long big = 1000L;        // long 字面量需加 L
float f = 3.14f;         // float 字面量需加 f
```

## 二、引用类型与包装类

除基础类型外都是引用类型（对象）。每个基础类型都有对应的包装类，便于在集合中存放：

```
Integer i = 100;          // 自动装箱
int x = i;                // 自动拆箱
Double d = 3.14;
```

注意：`Integer` 在 **\-128 ~ 127** 之间有缓存，`==` 比较的是引用，推荐使用 `equals` 比较值。

## 三、控制流

```
for (int i = 0; i < 10; i++) { ... }

for (String s : list) { ... }   // 增强 for

if (score >= 90) { ... }
else if (score >= 60) { ... }
else { ... }

switch (day) {
  case "MON" -> System.out.println("周一");
  case "TUE" -> System.out.println("周二");
  default -> System.out.println("其他");
}
```

Java 14+ 支持 `switch` 表达式（箭头语法），更简洁且避免贯穿（fall-through）问题。
