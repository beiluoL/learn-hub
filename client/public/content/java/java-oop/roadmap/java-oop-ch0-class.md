---
title: 类与对象
category: java
module: java-oop
subcat: roadmap
timeline: false
level: easy
tier: basic
readMinutes: 12
tags: 面向对象
summary: 理解类作为模板、对象作为实例，掌握构造器与 this。
order: 1
---

- 类是蓝图，对象是具体实例；`new` 在堆上创建对象。
- 构造器与类同名，无返回类型，用于初始化。
- `this` 指代当前对象，区分成员变量与参数。
- 字段（属性）+ 方法（行为）封装数据与逻辑。
- 成员变量有默认值，局部变量必须初始化。

```java
class User {
  String name;
  User(String name) { this.name = name; }
}
```

**自查清单**
- [ ] 能定义类与构造器
- [ ] 理解 this 作用
- [ ] 区分成员与局部变量
