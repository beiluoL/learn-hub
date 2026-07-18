---
title: 第 3 章 · Hooks 体系
category: frontend
module: react
subcat: roadmap
level: intermediate
readMinutes: 18
tags: "React, Hooks, useState, useEffect, useRef, useMemo"
summary: 掌握 useState/useEffect/useRef/useMemo/useCallback 与 Hook 规则，让函数组件拥有状态与副作用，这是 React 的核心。
order: 5
prereq: frontend/react/roadmap/react-ch2-component
---

Hooks 是 React 函数组件能「记住状态、处理副作用」的关键。这一章是重点中的重点。

## useState：让数据可变

```javascript
import { useState } from 'react';

function Counter() {
  const [count, setCount] = useState(0);
  return (
    <div>
      <p>计数：{count}</p>
      <button onClick={() => setCount(count + 1)}>+1</button>
    </div>
  );
}
```

- `useState(初始值)` 返回 `[值, 修改函数]`。
- 修改是**不可变**的：传新值或函数式更新 `setCount(prev => prev + 1)`。
- 连续多次更新用函数式更新最安全（避免闭包拿旧值）。

## useEffect：副作用与清理

副作用 = 渲染之外的事（请求、订阅、定时器）。`useEffect(fn, deps)`：依赖变化才重跑；返回清理函数。

```javascript
import { useState, useEffect } from 'react';

function Clock() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);   // 清理：避免内存泄漏
  }, []);                             // 空依赖：仅挂载时跑一次
  return <p>{now.toLocaleTimeString()}</p>;
}
```

**依赖数组是 Hook 最容易出错的地方**：漏写依赖会拿到旧值（闭包陷阱），多写会无限循环。

## useRef：引用 DOM 与存可变值

```javascript
import { useRef, useEffect } from 'react';

function AutoFocus() {
  const inputRef = useRef(null);
  useEffect(() => {
    inputRef.current?.focus();
  }, []);
  return <input ref={inputRef} placeholder="自动聚焦" />;
}
```

`useRef` 存的值变化**不会触发重渲染**，适合放「不需要引起 UI 变化」的变量（如定时器 id、上次值）。

## useMemo / useCallback：性能缓存

- `useMemo` 缓存「计算结果」，依赖不变就跳过重复计算。
- `useCallback` 缓存「函数引用」，避免传给 `React.memo` 子组件时因引用变化而重渲染。

```javascript
import { useMemo, useCallback, useState, memo } from 'react';

const ItemList = memo(function ItemList({ items, onPick }) {
  return (
    <ul>
      {items.map((it) => (
        <li key={it} onClick={() => onPick(it)}>{it}</li>
      ))}
    </ul>
  );
});

function Search() {
  const [q, setQ] = useState('');
  const all = ['Apple', 'Banana', 'Mango'];
  const filtered = useMemo(
    () => all.filter((x) => x.toLowerCase().includes(q.toLowerCase())),
    [q]
  );
  const handlePick = useCallback((x) => console.log('pick', x), []);
  return <ItemList items={filtered} onPick={handlePick} />;
}
```

> 不要过早优化。先用 React DevTools Profiler 定位瓶颈，再上 `memo/useMemo`。

## Hook 规则

1. 只在**函数组件顶层**调用 Hook，不要在 `if/for/嵌套函数` 里调用（保证每次调用顺序一致）。
2. 自定义 Hook 必须以 `use` 开头（让 ESLint 的 Hooks 规则能检查）。

## 自定义 Hook 实战：useFetch

```javascript
import { useState, useEffect } from 'react';

function useFetch(url) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let alive = true;
    fetch(url)
      .then((r) => r.json())
      .then((d) => { if (alive) { setData(d); setLoading(false); } });
    return () => { alive = false; };
  }, [url]);
  return { data, loading };
}
```

把「请求 + 加载态」的逻辑抽成 `useFetch`，任何组件都能复用——这就是 React 的组合威力。

## 小结

- `useState` 管状态、`useEffect` 管副作用（记得清理）、`useRef` 存可变值。
- 缓存用 `useMemo/useCallback + React.memo`，但别滥用。
- 自定义 Hook 以 `use` 开头，抽走可复用逻辑。
- 下一章学多组件共享状态（状态管理）。

```quiz
问题：useEffect 的依赖数组为空 [] 时，回调函数在什么时候执行？
A. 每次组件重新渲染后
B. 仅在组件首次挂载后执行一次
C. 仅在组件卸载时
D. 每次 state 变化
答案：B
解析：空依赖数组表示不依赖任何值，effect 只在挂载时运行一次，等价于 componentDidMount。
```
