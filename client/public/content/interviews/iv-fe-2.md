---
question: React 中 useState 和 useEffect 的工作原理？为什么 useEffect 依赖数组很重要？
category: frontend
difficulty: hard
tags: "React, Hooks, 渲染"
order: 8
---

**useState：**在函数组件里保存状态；每次渲染是一个独立闭包快照，setState 触发重新渲染并用新值替换。

**useEffect：**处理副作用（订阅、请求、DOM 操作）。依赖数组决定**何时重新执行**：

-   空数组 \[\]：仅挂载时执行一次
-   省略：每次渲染都执行（慎用）
-   有依赖：依赖变化才执行，并在下次执行前运行清理函数

依赖写错会导致：闭包捕获到旧值、重复请求、内存泄漏。eslint 的 exhaustive-deps 规则可辅助检查。
