---
title: 事件循环与宏微任务
category: interview
module: iv-fe
subcat: roadmap
timeline: false
level: hard
tier: key
readMinutes: 12
tags: "前端面试, JS, EventLoop"
summary: Event Loop、Promise 与渲染时机
order: 2
---

- 宏任务：script/setTimeout/setInterval/I/O
- 微任务：Promise.then/MutationObserver/queueMicrotask
- 每轮宏任务后清空微任务队列再渲染
- async/await 本质是 Promise 语法糖

```javascript
console.log(1);
setTimeout(() => console.log(2));
Promise.resolve().then(() => console.log(3));
console.log(4);
// 输出: 1 4 3 2
```

> node 与浏览器在 timer 与微任务优先级上略有差异。

**自查清单**
- [ ] 能预测输出顺序
- [ ] 能说宏微任务区别
