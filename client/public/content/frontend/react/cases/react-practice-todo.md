---
title: 练习 1 · 写一个可增删改的 Todo
category: frontend
module: react
subcat: cases
level: intermediate
readMinutes: 12
tags: "React, 练习, Todo, useState, 受控组件"
summary: 用 useState + 受控组件从零实现一个可新增、完成、删除、过滤的待办应用，巩固组件与状态基本功。
order: 11
prereq: frontend/react/roadmap/react-ch3-hooks
---

目标：不依赖任何 UI 库，纯 React 实现完整 Todo。把它当作检验前几章是否吃透的「小考」。

## 需求清单

- [ ] 输入框回车新增待办
- [ ] 每条可勾选「完成」（划线样式）
- [ ] 每条可删除
- [ ] 底部显示「已完成 / 总数」，并提供「只看未完成」切换
- [ ] 数据存在组件 `useState` 中

## 关键实现

```javascript
import { useState } from 'react';

let uid = 0;

export default function TodoApp() {
  const [todos, setTodos] = useState([]);
  const [text, setText] = useState('');
  const [onlyActive, setOnlyActive] = useState(false);

  const add = () => {
    const t = text.trim();
    if (!t) return;
    setTodos((prev) => [...prev, { id: ++uid, text: t, done: false }]);
    setText('');
  };

  const toggle = (id) =>
    setTodos((prev) => prev.map((x) => x.id === id ? { ...x, done: !x.done } : x));

  const remove = (id) => setTodos((prev) => prev.filter((x) => x.id !== id));

  const shown = onlyActive ? todos.filter((t) => !t.done) : todos;
  const doneCount = todos.filter((t) => t.done).length;

  return (
    <div>
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && add()}
        placeholder="输入待办，回车添加"
      />
      <ul>
        {shown.map((t) => (
          <li key={t.id}>
            <input type="checkbox" checked={t.done} onChange={() => toggle(t.id)} />
            <span style={{ textDecoration: t.done ? 'line-through' : 'none' }}>{t.text}</span>
            <button onClick={() => remove(t.id)}>删除</button>
          </li>
        ))}
      </ul>
      <p>已完成 {doneCount} / 共 {todos.length}</p>
      <label>
        <input type="checkbox" checked={onlyActive} onChange={(e) => setOnlyActive(e.target.checked)} />
        只看未完成
      </label>
    </div>
  );
}
```

## 要点拆解

- **不可变更新**：`setTodos` 永远传新数组（`map/filter/展开`），绝不直接改原数组。
- **函数式更新**：`add/toggle` 用 `prev => ...`，避免拿到旧状态。
- **派生数据**：过滤后的 `shown`、完成数 `doneCount` 都是实时计算，不额外存 state。

## 进阶挑战（可选）

1. 用 `useReducer` 改写，把 `add/toggle/remove` 收进一个 reducer。
2. 用 Zustand 把 todos 抽成全局 store，并 `persist` 到 localStorage。
3. 用本站的「在线运行」把这段代码跑起来，加点自己的功能（编辑、清空已完成）。

## 小结

能独立写完这个 Todo，说明你已掌握 React 最核心的「状态 → 视图」闭环。下一练做更复杂的后台骨架。
