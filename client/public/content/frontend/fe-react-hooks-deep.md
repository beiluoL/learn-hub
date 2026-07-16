---
title: React Hooks 深入：缓存优化、Ref 妙用与自定义 Hook
category: frontend
level: intermediate
readMinutes: 20
tags: "React, Hooks, useMemo, useCallback, 自定义Hook"
summary: React Hooks 深入：缓存优化、Ref 妙用与自定义 Hook。
order: 21
prereq: frontend/fe-react
---

## useState 的函数式更新

当新的 state 依赖旧的 state 时，直接传值可能会拿到过期的闭包值。此时应该使用函数式更新，确保始终拿到最新状态。

```tsx
import { useState } from 'react';

function Counter() {
  const [count, setCount] = useState(0);

  // 连续多次更新时直接赋值会出问题
  const handleClickWrong = () => {
    setCount(count + 1);
    setCount(count + 1); // 仍然是同一个 count
  };

  // 函数式更新每次都基于前一个状态
  const handleClickRight = () => {
    setCount((prev) => prev + 1);
    setCount((prev) => prev + 1);
  };

  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={handleClickRight}>+2</button>
    </div>
  );
}
```

## useEffect 的依赖与清理

`useEffect` 是 React 最常用的副作用 Hook，但也是最容易出错的。正确指定依赖数组至关重要，漏写依赖会导致闭包陷阱，多写依赖可能造成无限循环。

```tsx
import { useEffect, useState } from 'react';

function ChatRoom({ roomId }: { roomId: string }) {
  const [messages, setMessages] = useState<string[]>([]);

  useEffect(() => {
    const controller = new AbortController();

    fetch(`/api/messages/${roomId}`, { signal: controller.signal })
      .then((res) => res.json())
      .then(setMessages);

    // 清理函数：切换房间时取消上一个请求
    return () => controller.abort();
  }, [roomId]); // roomId 变化时重新执行

  return (
    <ul>
      {messages.map((msg, i) => (
        <li key={i}>{msg}</li>
      ))}
    </ul>
  );
}
```

## useMemo vs useCallback: 何时使用

两个 Hook 都是用于性能优化，但很多人不理解何时真正需要它们。

- **useMemo**: 缓存计算结果，当依赖不变时跳过重复计算
- **useCallback**: 缓存函数引用，避免子组件因引用变化而重新渲染

**使用场景判断**：
- 昂贵的计算(大数组过滤/排序) → useMemo
- 函数作为 props 传给 `React.memo` 包裹的子组件 → useCallback
- 函数作为其他 Hook 的依赖 → useCallback

```tsx
import { useMemo, useCallback, useState, memo } from 'react';

interface ItemListProps {
  items: string[];
  onSelect: (item: string) => void;
}

const ItemList = memo(function ItemList({ items, onSelect }: ItemListProps) {
  console.log('ItemList rendered');
  return (
    <ul>
      {items.map((item) => (
        <li key={item} onClick={() => onSelect(item)}>
          {item}
        </li>
      ))}
    </ul>
  );
});

function SearchPage() {
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState('');

  const allItems = ['Apple', 'Banana', 'Orange', 'Mango', 'Grape'];

  // 昂贵计算：过滤匹配项
  const filtered = useMemo(
    () => allItems.filter((item) =>
      item.toLowerCase().includes(query.toLowerCase())
    ),
    [query]
  );

  // 缓存回调引用，避免子组件不必要重渲染
  const handleSelect = useCallback((item: string) => {
    setSelected(item);
  }, []);

  return (
    <div>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search..."
      />
      <p>Selected: {selected}</p>
      <ItemList items={filtered} onSelect={handleSelect} />
    </div>
  );
}
```

**注意**：不要过早优化。只有当确认存在性能问题且通过 React DevTools Profiler 定位到瓶颈时，才考虑使用这些缓存 Hook。

## useRef 的两种用法

useRef 不仅能引用 DOM 元素，还能存储任意可变值而不触发重新渲染。

### 场景一：DOM 引用

```tsx
import { useRef, useEffect } from 'react';

function AutoFocusInput() {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // 组件挂载后自动聚焦
    inputRef.current?.focus();
  }, []);

  return <input ref={inputRef} placeholder="I'm auto-focused" />;
}
```

### 场景二：存储前一个值

```tsx
import { useRef, useEffect, useState } from 'react';

function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T>();
  useEffect(() => {
    ref.current = value;
  });
  return ref.current;
}

function ScoreTracker() {
  const [score, setScore] = useState(0);
  const prevScore = usePrevious(score);

  return (
    <div>
      <p>Current: {score}, Previous: {prevScore ?? 'N/A'}</p>
      <button onClick={() => setScore((s) => s + 10)}>+10</button>
    </div>
  );
}
```

## 自定义 Hook 实战

自定义 Hook 是 React 组合模式的精髓，将可复用的状态逻辑抽离出来。

### useDebounce

```tsx
import { useState, useEffect } from 'react';

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}

function SearchInput() {
  const [input, setInput] = useState('');
  const debouncedInput = useDebounce(input, 300);

  // 仅在用户停止输入 300ms 后发起请求
  useEffect(() => {
    if (debouncedInput) {
      console.log('API call with:', debouncedInput);
    }
  }, [debouncedInput]);

  return (
    <input
      value={input}
      onChange={(e) => setInput(e.target.value)}
      placeholder="Search..."
    />
  );
}
```

### useLocalStorage

```tsx
import { useState, useEffect } from 'react';

function useLocalStorage<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : initialValue;
    } catch {
      return initialValue;
    }
  });

  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(value));
  }, [key, value]);

  return [value, setValue] as const;
}
```

## Hooks 闭包陷阱与解决

闭包陷阱是 Hooks 开发中最经典的问题之一。当在 useEffect 或 useCallback 中引用了 state，但由于依赖数组没有包含该 state，导致拿到的永远是初始值。

**解决方案**：

1. 正确填写依赖数组(首选)
2. 使用 useRef 存储最新值
3. 使用 setState 的函数式更新

```tsx
import { useState, useRef, useCallback, useEffect } from 'react';

function TimerWithClosureTrap() {
  const [count, setCount] = useState(0);
  const countRef = useRef(count);
  countRef.current = count;

  // 使用 ref 绕过闭包陷阱
  const logCount = useCallback(() => {
    console.log('Latest count:', countRef.current);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCount((c) => c + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return <button onClick={logCount}>Log Count</button>;
}
```

## 实际开发中的应用 / 常见问题

### 社区常见问题

**Q: useMemo 和 React.memo 有什么区别？**

**A**: useMemo 缓存的是值(计算结果)，React.memo 缓存的是组件(只有 props 变化才重新渲染)。useMemo 用于 Hook 内部，React.memo 用于包裹组件导出。

**Q: 如何判断我的组件是否需要 useCallback？**

**A**: 如果函数作为 prop 传递给了使用 React.memo 的子组件，或者函数是 useEffect 等 Hook 的依赖，那么就需要 useCallback。否则不需要。

**Q: 自定义 Hook 的命名必须用 use 开头吗？**

**A**: 是的。React 的 ESLint 规则(Hooks 规则)依赖 `use` 前缀来验证 Hooks 的使用是否合法(必须在组件顶层调用等)。不以 `use` 开头会导致规则失效。

### 踩坑经验

在 `useEffect` 中使用 `setInterval` 时，如果直接引用 state 会在闭包中固定初始值。推荐使用 `setState(prev => prev + 1)` 的函数式更新，或者将 state 同步到 useRef 中，定时器读取 `ref.current`。

多个 `useEffect` 的执行顺序：按照定义顺序依次执行；清理函数在下一次 effect 执行前或组件卸载时运行。不要依赖多个 effect 之间的执行时序来传递数据——如果需要数据依赖，将它们合并到一个 effect 中。
