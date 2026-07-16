---
question: 解释 JavaScript 的事件循环（Event Loop）与宏任务/微任务。
category: frontend
difficulty: hard
tags: 事件循环, 异步, Promise
order: 17
---

JavaScript 是单线程的，靠**事件循环**实现异步非阻塞。

**执行栈：**同步代码在调用栈上依次执行。遇到异步 API（定时器、网络、Promise）时，任务被交给宿主环境，完成后回调进入任务队列。

**宏任务（macrotask）：**`setTimeout`、`setInterval`、I/O、UI 渲染、`MessageChannel`。

**微任务（microtask）：**`Promise.then`、`queueMicrotask`、`MutationObserver`。

**关键规则：**每执行完一个宏任务，就**清空所有微任务**，再进行渲染，然后取下一个宏任务。所以微任务优先级高于宏任务。

```javascript
console.log('1');
setTimeout(() => console.log('2'), 0);   // 宏任务
Promise.resolve().then(() => console.log('3')); // 微任务
console.log('4');
// 输出顺序：1 4 3 2
```

执行分析：

1. 同步输出 `1`、`4`。
2. 当前宏任务结束，清空微任务队列 → 输出 `3`。
3. 取下一个宏任务（timeout）→ 输出 `2`。

**常见坑：**微任务里再产生微任务会一直清空到空为止，若无限添加微任务会阻塞渲染。
