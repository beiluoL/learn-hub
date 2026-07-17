---
title: 原型与继承
category: interview
module: iv-fe
subcat: roadmap
timeline: false
level: medium
tier: core
readMinutes: 10
tags: "前端面试, JS, 原型"
summary: 原型链、class 与寄生组合继承
order: 3
---

- 每个对象有 __proto__，函数有 prototype
- 属性查找沿原型链向上
- class extends 基于原型链 + 构造函数
- instanceof 依赖原型链

```javascript
class Animal { constructor(n){ this.name=n; } }
class Dog extends Animal {
  bark() { return this.name + ' bark'; }
}
console.log(new Dog('a').bark());
```

> ES6 class 本质是原型继承的语法糖。

**自查清单**
- [ ] 能画原型链
- [ ] 能说继承实现
