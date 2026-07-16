---
title: 面向对象：封装、继承、多态
category: java
level: beginner
readMinutes: 14
tags: "OOP, 继承, 多态, 接口"
summary: 理解 Java 面向对象三大特性，以及接口与抽象类的取舍。
order: 2
---

## 一、封装（Encapsulation）

将字段私有化，通过 getter/setter 暴露，控制读写逻辑与校验：

```
public class User {
  private int age;
  public void setAge(int age) {
    if (age < 0) throw new IllegalArgumentException("年龄非法");
    this.age = age;
  }
  public int getAge() { return age; }
}
```

## 二、继承（Inheritance）

子类复用父类能力，使用 `extends`。Java 只支持**单继承**。构造时先调用父类构造器：

```
class Animal { void eat() { ... } }
class Cat extends Animal { void meow() { ... } }
```

## 三、多态（Polymorphism）

父类引用指向子类对象，运行时根据实际类型调用方法（动态绑定）：

```
Animal a = new Cat();
a.eat();   // 运行时调用 Cat 的实际实现
```

## 四、接口 vs 抽象类

| 维度 | 接口 interface | 抽象类 abstract class |
| --- | --- | --- |
| 继承 | 可多实现 | 单继承 |
| 字段 | 默认 public static final | 普通实例字段 |
| 构造器 | 无 | 有 |
| 适用 | 定义"能做什么"（能力） | 复用"是什么"（共性） |

优先用接口定义契约，用抽象类沉淀公共实现。
