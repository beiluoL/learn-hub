---
title: 第 0 章 · React 前置基础
category: frontend
module: react
subcat: roadmap
level: beginner
readMinutes: 14
tags: "React, 前置, JavaScript, ES6, 工具链"
summary: 跑通 React 前必须掌握的 JS(ES6+) 与工具链：解构、箭头函数、map/reduce、模块化、Promise，以及 Node/npm/Vite 的基本用法。
order: 2
prereq: frontend/react/roadmap/react-roadmap
---

这一章不写 React，只补「地基」。React 大量依赖现代 JavaScript，地基不牢后面会处处卡壳。

## 必须掌握的 JS 特性

**解构与扩展运算符**：React 里 `props` 几乎天天解构；`...` 用于合并对象/数组。

```javascript
const user = { name: 'Ada', age: 30 };
const { name, ...rest } = user;          // name='Ada', rest={age:30}
const list = [1, 2];
const next = [...list, 3];               // [1, 2, 3]
```

**箭头函数与 `this`**：箭头函数没有自己的 `this`，适合做回调（事件、定时器）。

```javascript
const nums = [1, 2, 3];
const doubled = nums.map((n) => n * 2);  // [2, 4, 6]
```

**数组方法**：`.map`（映射）、`.filter`（过滤）、`.reduce`（聚合）是渲染列表与派生数据的主力。

```javascript
const todos = [{ id: 1, done: true }, { id: 2, done: false }];
const active = todos.filter((t) => !t.done);
const count = todos.reduce((sum, t) => sum + (t.done ? 1 : 0), 0);
```

**模块系统**：React 组件靠 `import/export` 拼装。

```javascript
// utils.js
export const add = (a, b) => a + b;
// App.jsx
import { add } from './utils';
```

**Promise / async-await**：数据请求是异步的，必须会。

```javascript
async function loadUser(id) {
  const res = await fetch(`/api/users/${id}`);
  return res.json();
}
```

## 工具链

- **Node.js + npm**：React 项目用 npm（或 pnpm）装依赖、跑脚本。
- **Vite**：现代构建工具，启动快、热更新即时。创建项目：`npm create vite@latest my-app -- --template react`。
- **浏览器 DevTools**：至少会用 Console 看报错、用 React DevTools 看组件树。

## 自检清单

- [ ] 能不用 `var`、全程 `const/let`
- [ ] 能解释 `map` 与 `forEach` 的区别（前者返回新数组）
- [ ] 能写出 `fetch` + `await` 取数据
- [ ] 本地能跑起一个 Vite 项目并改代码热更新

做完这些，你就具备了学 React 的「语言门槛」。下一章正式写第一个 React 组件。
