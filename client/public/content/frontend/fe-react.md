---
title: React 核心：组件、Hooks 与状态
category: frontend
level: intermediate
readMinutes: 18
tags: "React, Hooks, 状态管理, 组件"
summary: 掌握函数组件与 Hooks 心智模型，理解渲染与副作用。
order: 3
---

## 一、组件与 JSX

组件即返回 UI 的函数；JSX 是 `React.createElement` 的语法糖：

```
function Greet({ name }) {
  return <h1>Hello, {name}</h1>;
}
```

## 二、Hooks 三剑客

```
const [count, setCount] = useState(0);     // 状态
useEffect(() => {                          // 副作用
  const id = setInterval(() => setCount(c => c+1), 1000);
  return () => clearInterval(id);          // 清理函数
}, []);                                    // 依赖为空 → 仅挂载时
const ref = useRef(null);                  // 跨渲染保存可变值
```

-   `useState`：状态更新是**不可变**的，setState 触发重渲染
-   `useEffect`：依赖变化才执行；返回清理函数
-   状态提升 / Context 解决跨组件共享

## 三、渲染优化

-   `React.memo` 包裹组件避免无谓重渲染
-   `useMemo` 缓存计算，`useCallback` 缓存函数
-   列表加稳定 `key`（勿用 index 作 key 的常规做法）
