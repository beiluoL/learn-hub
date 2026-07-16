---
question: var、let、const 的区别？什么是变量提升（Hoisting）？
category: frontend
difficulty: middle
tags: "JavaScript, 作用域, ES6"
order: 7
---

**区别：**

-   var：函数作用域、可重复声明、会提升且初始化为 undefined
-   let：块级作用域、不可重复声明、存在"暂时性死区"（声明前访问报错）
-   const：块级作用域、声明后**引用**不可变（对象内部属性可变）

**变量提升：**JS 引擎在编译阶段把变量/函数声明移到作用域顶部。var 提升并赋 undefined；let/const 提升但不初始化（TDZ）；函数声明整体提升。
