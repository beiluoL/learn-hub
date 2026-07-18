---
title: 第 5 章 · React Router 路由
category: frontend
module: react
subcat: roadmap
level: intermediate
readMinutes: 16
tags: "React, React Router, 路由, 嵌套路由, 守卫"
summary: 用 React Router 搭建多页应用：路由表、Link 导航、useParams 取参、嵌套路由、登录守卫与懒加载。
order: 7
prereq: frontend/react/roadmap/react-ch4-state
---

单页应用（SPA）靠路由在不同「页面」间切换而不刷新。React 生态主流是 `react-router-dom`。

## 声明式路由表

```javascript
import { createBrowserRouter, RouterProvider, Route } from 'react-router-dom';

const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, element: <Home /> },
      { path: 'user/:id', element: <User /> },
    ],
  },
]);

function App() {
  return <RouterProvider router={router} />;
}
```

## 导航与取参

```javascript
import { Link, useNavigate, useParams } from 'react-router-dom';

function Nav() {
  return <Link to="/user/42">查看用户 42</Link>;
}

function User() {
  const { id } = useParams();          // "42"
  const navigate = useNavigate();
  return <button onClick={() => navigate('/')}>返回</button>;
}
```

- `<Link>` 渲染成 `<a>`，点击不刷新页面。
- `useParams()` 取动态段；`useNavigate()` 做编程式跳转。

## 嵌套路由与布局

父路由用 `<Outlet />` 占位子页面渲染位置：

```javascript
import { Outlet } from 'react-router-dom';

function Layout() {
  return (
    <div>
      <Nav />
      <main><Outlet /></main>
    </div>
  );
}
```

## 登录守卫（保护路由）

```javascript
function RequireAuth({ children }) {
  const loggedIn = useAuth();          // 你的登录状态 hook
  if (!loggedIn) return <Navigate to="/login" replace />;
  return children;
}

// 路由表
{ path: 'dashboard', element: <RequireAuth><Dashboard /></RequireAuth> }
```

## 懒加载（代码分割）

路由级懒加载能显著减小首屏体积：

```javascript
import { lazy, Suspense } from 'react';

const Admin = lazy(() => import('./Admin'));

<Route path="admin" element={
  <Suspense fallback={<p>加载中…</p>}>
    <Admin />
  </Suspense>
} />
```

## 实战小项目：多页小站

目标：首页 / 列表 / 详情 / 关于 四页 + 顶部导航，详情页读 `:id` 展示，未登录访问「我的」跳登录。

要点：用 `createBrowserRouter` 组织；`Layout` 包 `<Outlet>`；详情页 `useParams`；「我的」加 `RequireAuth`。

## 小结

- 路由表 + `<Outlet>` 组织多页；`<Link>` / `useNavigate` 导航。
- `useParams` 取动态参数；守卫用 `<Navigate>` 重定向。
- 路由级 `React.lazy` 做代码分割。
- 下一章补齐工程化与生态（Vite/TS/请求/UI 库/测试）。
