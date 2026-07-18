---
title: 练习 2 · 后台管理骨架（路由 + 状态）
category: frontend
module: react
subcat: cases
level: intermediate
readMinutes: 13
tags: "React, 练习, 后台, React Router, Zustand, 守卫"
summary: 组合路由、全局状态与守卫，搭一个含侧边栏布局、用户列表、新增表单的后台骨架，打通「工程化」能力。
order: 12
prereq: frontend/react/roadmap/react-ch8-project
---

目标：把第 4~8 章的知识串起来，做一个能跑的后台骨架（数据用本地 mock，不接真后端）。

## 需求清单

- [ ] 侧边栏布局：`/`、`/users`、`/users/new` 共用 `Layout`（含 `<Outlet/>`）
- [ ] 用户列表：从 Zustand store 读取，支持删除
- [ ] 新增用户：表单写入 store
- [ ] `/users` 需登录守卫，未登录跳 `/login`
- [ ] 路由懒加载 `/users/new`

## Store（Zustand）

```javascript
import { create } from 'zustand';

export const useUsers = create((set) => ({
  users: [
    { id: 1, name: 'Ada', role: 'admin' },
    { id: 2, name: 'Bob', role: 'user' },
  ],
  add: (u) => set((s) => ({ users: [...s.users, { id: Date.now(), ...u }] })),
  remove: (id) => set((s) => ({ users: s.users.filter((u) => u.id !== id) })),
}));
```

## 登录态（简化）

```javascript
import { create } from 'zustand';

export const useAuth = create((set) => ({
  loggedIn: false,
  login: () => set({ loggedIn: true }),
  logout: () => set({ loggedIn: false }),
}));
```

## 路由表与守卫

```javascript
import { createBrowserRouter, RouterProvider, Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './store/auth';

function RequireAuth() {
  const loggedIn = useAuth((s) => s.loggedIn);
  return loggedIn ? <Outlet /> : <Navigate to="/login" replace />;
}

const router = createBrowserRouter([
  { path: '/login', element: <Login /> },
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, element: <Home /> },
      {
        element: <RequireAuth />,
        children: [
          { path: 'users', element: <UserList /> },
          { path: 'users/new', element: <UserNew /> },
        ],
      },
    ],
  },
]);
```

## 用户列表页

```javascript
import { useUsers } from '../store/users';

export default function UserList() {
  const users = useUsers((s) => s.users);
  const remove = useUsers((s) => s.remove);
  return (
    <table>
      <thead><tr><th>ID</th><th>姓名</th><th>角色</th><th>操作</th></tr></thead>
      <tbody>
        {users.map((u) => (
          <tr key={u.id}>
            <td>{u.id}</td><td>{u.name}</td><td>{u.role}</td>
            <td><button onClick={() => remove(u.id)}>删除</button></td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
```

## 进阶挑战（可选）

1. 给「新增用户」加表单校验（姓名非空、角色下拉）。
2. 用 Ant Design 的 `Table` / `Form` 替换原生表格与表单。
3. 列表数据改为 `useFetch` + mock API（如 jsonplaceholder），加加载态与错误态。

## 小结

能跑通这个骨架，说明你已经具备「用 React 搭一个真实后台」的基础工程能力。接下来就是做更复杂、更完整的项目写进简历。
