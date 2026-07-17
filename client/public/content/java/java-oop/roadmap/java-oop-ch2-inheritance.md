---
title: 继承
category: java
module: java-oop
subcat: roadmap
timeline: false
level: medium
tier: core
readMinutes: 12
tags: 面向对象
summary: extends 复用父类，super 调用父类，理解重写与 Object。
order: 3
---

- `class Sub extends Super` 复用父类成员。
- `super()` 调用父类构造器（默认隐式调用无参）。
- 方法重写（override）：签名一致，注解 `@Override`。
- 所有类最终继承自 `Object`（equals/hashCode/toString）。
- `final` 类不可继承、final 方法不可重写。

```java
class Animal { void sound() {} }
class Cat extends Animal {
  @Override void sound() { System.out.println("meow"); }
}
```

**自查清单**
- [ ] 会用 extends
- [ ] 理解 super 调用
- [ ] 正确重写方法
