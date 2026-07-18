---
title: 第 2 章 · 组件化开发
category: frontend
module: react
subcat: roadmap
level: beginner
readMinutes: 16
tags: "React, 组件, Props, children, 列表, 受控组件"
summary: 学会把界面拆成可复用组件，掌握 props 传参、children 组合、列表 key、受控组件与表单处理。
order: 4
prereq: frontend/react/roadmap/react-ch1-core
---

这一章把「一个 App 大组件」拆成多个小组件，并讲清楚数据怎么在组件间流动。

## 拆分原则

- 一个组件只做一件事；能复用就抽出来。
- 数据向下通过 `props` 传递；事件向上通过**回调 props** 传递。

```javascript
function Button({ label, onClick }) {
  return <button onClick={onClick}>{label}</button>;
}

function App() {
  return <Button label="点我" onClick={() => alert('hi')} />;
}
```

## children：插槽式组合

`children` 让父组件把「内容」塞进子组件内部，类似 Vue 的默认插槽。

```javascript
function Card({ title, children }) {
  return (
    <div className="card">
      <h3>{title}</h3>
      <div>{children}</div>
    </div>
  );
}

function App() {
  return (
    <Card title="公告">
      <p>今天放假半天。</p>
    </Card>
  );
}
```

## 列表与稳定 key

```javascript
function UserList({ users }) {
  return (
    <ul>
      {users.map((u) => (
        <li key={u.id}>{u.name}</li>
      ))}
    </ul>
  );
}
```

**为什么不要用数组下标当 key**：列表增删时下标会错位，导致 React 复用了错误的 DOM/状态。用数据自身的稳定 id。

## 受控组件（表单）

React 表单常用「受控」写法：值来自 state，`onChange` 同步回去。

```javascript
import { useState } from 'react';

function NameInput() {
  const [name, setName] = useState('');
  return (
    <input
      value={name}
      onChange={(e) => setName(e.target.value)}
      placeholder="输入姓名"
    />
  );
}
```

> 注意：`onChange` 在 React 里是「输入即触发」（等同于原生 `input` 事件），不是原生 `change`。

## 实战小项目：Todo 列表组件

目标：把上一章的待办拆成 `TodoItem` + `TodoList` 两个组件。

要点拆解：
- `TodoItem({ todo, onToggle })`：渲染单条，复选框勾选调用 `onToggle(todo.id)`。
- `TodoList({ todos, onToggle })`：`.map` 渲染 `TodoItem`，`key={todo.id}`。
- `App` 持有 `todos` 与 `onToggle` 回调，向下传递。
- 此时勾选还**不会改数据**（改状态要等第 3 章 Hooks）。

拆好组件后，界面结构清晰、易于复用，这正是 React 工程化的第一步。

## 小结

- 数据向下 `props`、事件向上回调；`children` 做内容插槽。
- 列表用稳定 `key`（数据 id，非下标）。
- 表单用受控组件：`value` + `onChange`。
- 下一章用 Hooks 让组件「活」起来（状态可变）。
