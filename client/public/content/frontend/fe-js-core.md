---
title: JavaScript 核心：闭包、原型与 this
category: frontend
level: beginner
readMinutes: 14
tags: "JavaScript, 闭包, 原型链, this"
summary: 夯实 JS 三大难点，理解语言本质而非死记语法。
order: 1
---

## 一、闭包（Closure）

函数与其词法环境的组合。内层函数可访问外层作用域变量，即使外层已执行完毕：

```
function outer() {
  let count = 0;
  return () => ++count;
}
const fn = outer();
fn(); // 1
```

典型用途：数据私有化、函数工厂、防抖节流。

## 二、原型与原型链

每个对象有隐藏的 `[[Prototype]]`（`__proto__`），向上查找属性形成**原型链**。构造函数通过 `prototype` 共享方法：

```
function Person(name) { this.name = name; }
Person.prototype.say = function () { return this.name; };
const p = new Person("Tom");
p.say(); // 沿原型链找到 say
```

## 三、this 的绑定规则

优先级：**new** > 显式绑定(call/apply/bind) > 隐式绑定(对象调用) > 默认(严格模式 undefined)。箭头函数没有自己的 this，继承外层。

```
const obj = {
  name: "A",
  fn() { return this.name; },     // 隐式绑定 → "A"
  arrow: () => this.name          // 箭头 → 外层 this
};
```
