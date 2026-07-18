---
title: 第 1 章 · React 核心基础
category: frontend
module: react
subcat: roadmap
level: beginner
readMinutes: 16
tags: "React, JSX, 组件, Props, 渲染"
summary: 建立「组件即函数、JSX 即 UI」的心智模型，学会函数组件、props 传参、条件与列表渲染，跑起第一个 React 应用。
order: 3
prereq: frontend/react/roadmap/react-ch0-prebasic
---

这一章是 React 的「语法入门」，把组件怎么写、数据怎么传、UI 怎么跟着变讲清楚。

## 核心心智模型

**组件就是一个返回 UI 的函数**；**JSX** 是 `React.createElement` 的语法糖，让你用类 HTML 的方式描述界面。

```javascript
function Greet({ name }) {
  return <h1>Hello, {name}</h1>;
}
```

`{name}` 里的 `{ }` 可以放任意 JS 表达式（变量、函数调用、三元等），但不能放 `if/for` 语句——语句要写在 `return` 外面。

## 跑起第一个应用

```javascript
import { createRoot } from 'react-dom/client';

function App() {
  return <h1>我的第一个 React 应用</h1>;
}

createRoot(document.getElementById('root')).render(<App />);
```

## props：父传子的数据通道

```javascript
function Avatar({ src, alt }) {
  return <img src={src} alt={alt} width={48} />;
}

function App() {
  return <Avatar src="/me.png" alt="我的头像" />;
}
```

- `props` 是只读的，子组件不能修改父传来的 `props`。
- 透传多个属性可用扩展运算符：`<Avatar {...user} />`。

## 条件渲染

React 没有 `v-if`，用 JS 表达式控制：

```javascript
function Status({ loggedIn }) {
  return <p>{loggedIn ? '已登录' : '请登录'}</p>;
}

function List({ items }) {
  return items.length === 0
    ? <p>暂无数据</p>
    : <ul>{items.map((it) => <li key={it.id}>{it.text}</li>)}</ul>;
}
```

常用写法：`&&`（条件真才渲染）、三元（二选一）。

## 列表渲染与 key

```javascript
function TodoList({ todos }) {
  return (
    <ul>
      {todos.map((t) => (
        <li key={t.id}>{t.text}</li>
      ))}
    </ul>
  );
}
```

`key` 必须是**稳定且唯一**的（用数据 id，不要用数组下标），React 靠它识别哪些项变了。

## 实战小项目：可过滤的待办清单（雏形）

目标：数据写死在组件里，用 `map` 渲染列表，用 `&&` 显示「完成数」。

要点拆解：
- 用 `const todos = [...]` 存一份假数据，每项 `{ id, text, done }`。
- 统计用 `todos.filter(t => t.done).length`，在 JSX 里直接输出。
- 这时数据还**不能改**——改状态要等下一章 Hooks。

做完你就理解了 React 最底层的「数据 → `{ }` → 视图」闭环，这也是后续一切的基石。

## 小结

- 组件 = 函数，JSX = UI 描述；`{ }` 里写表达式。
- `props` 只读，父传子；列表务必加稳定 `key`。
- 下一章学习如何把界面拆成可复用组件 + 让数据「可变」。

```quiz
问题：JSX 里要用哪个属性替代 HTML 的 class？
A. className
B. class
C. css
D. styleClass
答案：A
解析：class 是 JS 保留字，JSX 中用 className；行内样式用 style 且值为对象。
```
