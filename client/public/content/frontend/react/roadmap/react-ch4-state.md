---
title: 第 4 章 · 状态管理
category: frontend
module: react
subcat: roadmap
level: intermediate
readMinutes: 16
tags: "React, 状态管理, Context, useReducer, Zustand, Redux"
summary: 掌握状态提升、useContext + useReducer 跨层共享，以及 Zustand / Redux 等第三方方案，知道何时该用哪种。
order: 6
prereq: frontend/react/roadmap/react-ch3-hooks
---

当多个组件需要同一份数据时，就要考虑「状态管理」。从简单到复杂有四档。

## 1. 状态提升（最基础）

把状态提到最近公共父组件，通过 `props` 下发、通过回调回传。

```javascript
function Parent() {
  const [text, setText] = useState('');
  return (
    <>
      <Input value={text} onChange={setText} />
      <Preview text={text} />
    </>
  );
}
```

适合：只有 2~3 层、范围小的共享。

## 2. useContext：跨层透传

不想一层层传 `props` 时，用 Context 直接「空投」到深层组件。

```javascript
import { createContext, useContext, useState } from 'react';

const ThemeContext = createContext(null);

function App() {
  const [theme, setTheme] = useState('light');
  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      <Toolbar />
    </ThemeContext.Provider>
  );
}

function Toolbar() {
  const { theme } = useContext(ThemeContext);
  return <p>当前主题：{theme}</p>;
}
```

注意：Context 值变化会让所有消费组件重渲染，别把高频变化的数据放进去。

## 3. useReducer：复杂状态机

当状态有多个动作、互相纠缠时，用 `useReducer` 把「怎么变」集中到一个纯函数里。

```javascript
import { useReducer } from 'react';

function reducer(state, action) {
  switch (action.type) {
    case 'add': return [...state, action.payload];
    case 'toggle': return state.map((t) =>
      t.id === action.id ? { ...t, done: !t.done } : t);
    default: return state;
  }
}

function Todos() {
  const [todos, dispatch] = useReducer(reducer, []);
  return <button onClick={() => dispatch({ type: 'add', payload: { id: Date.now(), done: false } })}>加</button>;
}
```

## 4. 第三方库：Zustand / Redux

当应用变大、需要跨页面共享（用户、购物车、权限），上全局 store。

**Zustand（轻量，推荐入门）**：

```javascript
import { create } from 'zustand';

const useCart = create((set) => ({
  items: [],
  add: (item) => set((s) => ({ items: [...s.items, item] })),
}));

function Product() {
  const add = useCart((s) => s.add);
  return <button onClick={() => add({ id: 1 })}>加入购物车</button>;
}
```

**Redux Toolkit（约定重、生态全）**：适合大团队强规范项目。

## 选型建议

- 2~3 层小共享 → 状态提升 / `useState`。
- 主题、语言等低频全局 → `Context`。
- 多动作复杂状态 → `useReducer`。
- 跨页面、需持久化、多人协作 → Zustand / Redux。

## 实战小项目：购物车 store

目标：用 Zustand 建 `useCart`，支持 `add / remove / 总数`，并持久化到 `localStorage`（用 `persist` 中间件）。

做完你就掌握了「什么时候用什么」的判断力，这是中级 React 的分水岭。

## 小结

- 状态提升最基础；`Context` 跨层但易误用；`useReducer` 管复杂逻辑。
- 全局 store 首选 Zustand（轻），大团队可选 Redux Toolkit。
- 下一章用 React Router 把多页应用串起来。
