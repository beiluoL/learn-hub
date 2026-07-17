---
title: JS 闭包与作用域
category: interview
module: iv-fe
subcat: roadmap
timeline: false
level: medium
tier: core
readMinutes: 9
tags: "前端面试, JS, 闭包"
summary: 词法作用域、闭包形成与经典坑
order: 1
---

- 闭包：函数捕获其词法作用域的变量
- for 循环 var 闭包陷阱，let 块级作用域解决
- 闭包可用于私有变量、函数工厂、防抖节流

```javascript
function createCounter() {
  let count = 0;
  return () => ++count;
}
const c = createCounter();
console.log(c(), c()); // 1 2
```

> 闭包会导致变量无法被回收，注意内存占用。

**自查清单**
- [ ] 能解释闭包原理
- [ ] 能举出应用场景
