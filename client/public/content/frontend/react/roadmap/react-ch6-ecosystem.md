---
title: 第 6 章 · 生态与工程化
category: frontend
module: react
subcat: roadmap
level: intermediate
readMinutes: 16
tags: "React, Vite, TypeScript, axios, 测试, 样式"
summary: 补齐生产级 React 工程能力：Vite 配置、TypeScript 接入、请求封装、UI 库选型、测试与样式方案。
order: 8
prereq: frontend/react/roadmap/react-ch5-router
---

会用 React 写组件只是开始；能「工程化」交付才是生产力。这一章串起日常开发所需的工具链。

## Vite 配置

`vite.config.js` 常用三件事：路径别名、开发代理跨域、环境变量。

```javascript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig({
  plugins: [react()],
  resolve: { alias: { '@': path.resolve(__dirname, 'src') } },
  server: { proxy: { '/api': 'http://localhost:3000' } },
});
```

环境变量用 `import.meta.env.VITE_XXX` 读取，`.env` 文件不要提交密钥。

## TypeScript 接入

给组件加类型能大幅减少 bug：

```typescript
interface Todo {
  id: number;
  text: string;
  done: boolean;
}

function TodoItem({ todo, onToggle }: { todo: Todo; onToggle: (id: number) => void }) {
  return (
    <li>
      <input type="checkbox" checked={todo.done} onChange={() => onToggle(todo.id)} />
      {todo.text}
    </li>
  );
}
```

事件类型：`React.ChangeEvent<HTMLInputElement>`、`React.MouseEvent` 等。

## 网络请求封装

```javascript
// request.js
export async function request(url, options) {
  const res = await fetch(url, options);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}
```

需要拦截器/超时再上 `axios`：`axios.create({ baseURL, timeout })`。

## UI 库选型（挑 1~2 个）

- Ant Design：中后台首选，组件全、表格表单强。
- MUI：Material 设计规范，社区大。
- shadcn/ui：基于 Radix + Tailwind，可复制源码、可定制。

## 测试：Vitest + React Testing Library

```javascript
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import Counter from './Counter';

it('点击 +1 计数增加', () => {
  render(<Counter />);
  fireEvent.click(screen.getByText('+1'));
  expect(screen.getByText(/计数：1/)).toBeTruthy();
});
```

## 样式方案

- CSS Modules（`*.module.css`，作用域隔离）
- Tailwind CSS（原子类，开发快）
- CSS-in-JS（styled-components，运行时开销）

## 实战小项目：后台骨架

目标：Vite + TS + Ant Design 搭一个含侧边栏布局、用户表格、新增表单的后台页面，数据用 `request` 兜底。

## 小结

- Vite 管构建；TS 管类型；`fetch/axios` 管请求；UI 库管效率。
- Vitest + RTL 写组件测试；样式按团队习惯选。
- 下一章深入原理，理解 React「为什么快 / 为什么这样设计」。
