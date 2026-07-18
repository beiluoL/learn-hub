---
title: 第 7 章 · 进阶原理
category: frontend
module: react
subcat: roadmap
level: advanced
readMinutes: 17
tags: "React, 原理, Fiber, 协调, 并发, 性能优化"
summary: 理解渲染/提交两阶段、Fiber 与协调 diff、key 的底层作用、并发特性（Suspense/useTransition）与性能优化策略。
order: 9
prereq: frontend/react/roadmap/react-ch6-ecosystem
---

懂原理才能从「会用」到「用得好」。这一章讲 React 内部怎么工作。

## 渲染（render）与提交（commit）

- **渲染阶段**：React 调用组件函数，算出「新的虚拟 DOM 树」，并和旧的做 diff（可中断、可复用）。
- **提交阶段**：把差异真正应用到真实 DOM（不可中断）。

这就是为什么在 `render` 阶段不要写副作用（可能被打断重跑），副作用都要放 `useEffect`（提交后执行）。

## Fiber 与协调（Reconciliation）

React 用 **Fiber** 把渲染拆成小任务，可暂停/恢复，避免长任务卡住页面。协调时的 diff 规则：

- 同类型元素 → 复用节点，只更新变化的属性。
- 不同类型元素 → 整棵卸载重建。
- **`key` 的作用**：列表里用 key 告诉 React「这是同一个元素的新位置」，从而复用 DOM 与状态，而不是误删重建。

## 为什么不在 render 里改状态

```javascript
function Bad() {
  const [n, setN] = useState(0);
  setN(n + 1);          // ❌ 在渲染中 setState → 无限循环
  return <p>{n}</p>;
}
```

状态修改必须在事件/副作用里触发，React 才能正确调度一次重渲染。

## 并发特性（Concurrent）

React 18 起支持「并发渲染」，让高优更新打断低优更新：

```javascript
import { useState, useTransition } from 'react';

function Search() {
  const [query, setQuery] = useState('');
  const [isPending, startTransition] = useTransition();
  const onChange = (e) => {
    const v = e.target.value;
    startTransition(() => setQuery(v));   // 标记为非紧急更新
  };
  return <input value={query} onChange={onChange} />;
}
```

- `useTransition`：把某次更新标为「可打断」。
- `useDeferredValue`：延迟某个值，保持输入流畅。
- `Suspense`：在组件「加载中」时展示 fallback。

## 性能优化清单

1. `React.memo` 包裹纯展示组件，避免父重渲染带动子。
2. `useMemo` 缓存昂贵计算；`useCallback` 缓存传给 memo 子组件的函数。
3. 列表用稳定 `key`；大数据列表用虚拟滚动。
4. 路由/组件级 `React.lazy` 代码分割，减小首屏。

> 优化前先用 React DevTools Profiler 定位瓶颈，**不要盲目 memo**。

## 实战小项目：迷你 render

目标：用 30 行代码实现一个 `createElement` + `render` 的极简版，理解「虚拟 DOM → diff → 真实 DOM」。

```javascript
function createElement(type, props, ...children) {
  return { type, props: { ...props, children } };
}
function render(el, container) {
  const dom = document.createElement(el.type);
  Object.entries(el.props || {}).forEach(([k, v]) => {
    if (k !== 'children') dom[k] = v;
  });
  (el.props.children || []).forEach((c) =>
    render(c, dom)
  );
  container.appendChild(dom);
}
```

## 小结

- 渲染可中断、提交不可中断；副作用放 `useEffect`。
- Fiber + key 决定复用策略；并发特性提升交互流畅度。
- 性能优化先量后改，别滥用 `memo`。
- 下一章把知识落到一个完整项目里。
