---
title: React 状态管理：从 Context 到 Zustand
category: frontend
level: intermediate
readMinutes: 10
tags: React, 状态管理, Zustand, Context
summary: 厘清何时用本地状态、Context 还是外部状态库，掌握 Zustand 的极简用法。
order: 7
prereq: frontend/fe-react
---

# React 状态管理：从 Context 到 Zustand

状态管理没有银弹，关键是**按作用域选工具**：能用本地状态就别上全局。

## 一、状态分层

| 作用域 | 方案 |
| --- | --- |
| 单组件 | `useState` / `useReducer` |
| 跨少数组件 | 提升状态 + props |
| 全局、低频变化 | Context |
| 全局、高频/复杂 | Zustand / Redux |
| 服务端数据 | React Query / SWR |

## 二、Context 的陷阱

Context 适合"低频"全局值（主题、登录用户）。但 **任何 value 变化都会让所有消费组件重渲染**，不适合高频状态。

```jsx
const ThemeContext = createContext("light");

function App() {
  return (
    <ThemeContext.Provider value="dark">
      <Toolbar />
    </ThemeContext.Provider>
  );
}
```

## 三、Zustand：极简全局状态

```jsx
import { create } from "zustand";

const useStore = create((set) => ({
  count: 0,
  inc: () => set((s) => ({ count: s.count + 1 })),
}));

function Counter() {
  // 只订阅 count，其他状态变化不会触发本组件重渲染
  const count = useStore((s) => s.count);
  const inc = useStore((s) => s.inc);
  return <button onClick={inc}>{count}</button>;
}
```

优点：无 Provider 包裹、按需订阅（选择器）避免多余渲染、API 极简。

## 四、服务端状态用专门的库

列表、详情这类"服务端数据"别塞进全局 store，用 React Query 管理缓存、重试、失效：

```jsx
const { data, isLoading } = useQuery({
  queryKey: ["users"],
  queryFn: fetchUsers,
});
```

> 原则：客户端状态与服务端状态分开管理；全局状态越少越好。
