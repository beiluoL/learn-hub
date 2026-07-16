---
title: 前端路由原理与 React Router 进阶
category: frontend
level: intermediate
readMinutes: 16
tags: "路由, React Router, Hash, History"
summary: 前端路由原理与 React Router 进阶。
order: 29
prereq: frontend/fe-react
---

## Hash vs History API

前端路由的核心是在不刷新页面的前提下改变 URL 并切换视图，有两种主流实现方式。

### Hash 路由

利用 URL 的 hash 部分(`#` 之后)，hash 变化不会触发页面刷新。通过 `hashchange` 事件监听。

```
https://example.com/#/users/123
```

- 优点：兼容性好，不需要服务端配置
- 缺点：URL 中有 `#` 不好看，SEO 不友好

```javascript
class HashRouter {
  constructor(routes) {
    this.routes = routes;
    window.addEventListener('hashchange', () => this.render());
    this.render();
  }

  render() {
    const hash = window.location.hash.slice(1) || '/';
    const Component = this.routes[hash];
    if (Component) {
      document.getElementById('app').innerHTML = Component();
    }
  }
}
```

### History 路由

利用 HTML5 History API(`pushState`/`replaceState`) 和 `popstate` 事件。

- 优点：URL 干净美观，支持 SEO
- 缺点：需要服务端配置，将所有路由回退到入口 HTML

```javascript
class HistoryRouter {
  constructor(routes) {
    this.routes = routes;
    window.addEventListener('popstate', () => this.render());
    this.render();

    // 拦截页面内所有链接点击
    document.addEventListener('click', (e) => {
      const target = e.target.closest('a');
      if (target && target.href.startsWith(window.location.origin)) {
        e.preventDefault();
        this.push(target.pathname);
      }
    });
  }

  push(path) {
    window.history.pushState(null, '', path);
    this.render();
  }

  render() {
    const path = window.location.pathname;
    const Component = this.routes[path] || this.routes['/404'];
    document.getElementById('app').innerHTML = Component();
  }
}
```

## React Router 核心用法

React Router v6 的 API 相比 v5 有较大变化，以下是 v6 的标准用法。

```tsx
import {
  createBrowserRouter,
  RouterProvider,
  Outlet,
  Link,
  useParams,
  useNavigate,
} from 'react-router-dom';

// 路由配置(集中式)
const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, element: <HomePage /> },
      {
        path: 'users',
        element: <UsersLayout />,
        children: [
          { index: true, element: <UserList /> },
          { path: ':userId', element: <UserDetail /> },
        ],
      },
      { path: '*', element: <NotFound /> },
    ],
  },
]);

function Layout() {
  return (
    <div>
      <nav>
        <Link to="/">Home</Link>
        <Link to="/users">Users</Link>
      </nav>
      <main>
        <Outlet /> {/* 子路由渲染位置 */}
      </main>
    </div>
  );
}

function UserDetail() {
  const { userId } = useParams(); // 获取动态参数
  const navigate = useNavigate();

  return (
    <div>
      <h2>User: {userId}</h2>
      <button onClick={() => navigate(-1)}>Back</button>
    </div>
  );
}

function App() {
  return <RouterProvider router={router} />;
}
```

## 路由守卫

路由守卫用于控制访问权限，典型场景是认证保护和角色权限。

```tsx
import { Navigate, Outlet, useLocation } from 'react-router-dom';

// 认证守卫
function RequireAuth() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const location = useLocation();

  if (!isAuthenticated) {
    // 重定向到登录页，并记住来源
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
}

// 角色守卫
function RequireRole({ role }: { role: string }) {
  const userRole = useAuthStore((s) => s.user?.role);

  if (userRole !== role) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
}

// 在路由配置中使用
const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      { path: 'login', element: <LoginPage /> },
      {
        element: <RequireAuth />, // 守卫包裹
        children: [
          { path: 'dashboard', element: <Dashboard /> },
          {
            element: <RequireRole role="admin" />,
            children: [
              { path: 'admin', element: <AdminPanel /> },
            ],
          },
        ],
      },
    ],
  },
]);
```

## 懒加载路由

大型应用需要按路由拆分代码，React.lazy + Suspense 是最佳实践。

```tsx
import { lazy, Suspense } from 'react';

const Dashboard = lazy(() => import('./pages/Dashboard'));
const Settings = lazy(() => import('./pages/Settings'));
const Reports = lazy(() => import('./pages/Reports'));

function LoadingFallback() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full" />
    </div>
  );
}

const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      {
        path: 'dashboard',
        element: (
          <Suspense fallback={<LoadingFallback />}>
            <Dashboard />
          </Suspense>
        ),
      },
      {
        path: 'settings',
        element: (
          <Suspense fallback={<LoadingFallback />}>
            <Settings />
          </Suspense>
        ),
      },
    ],
  },
]);
```

## URL SearchParams 与面包屑

```tsx
import { useSearchParams } from 'react-router-dom';

function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const page = parseInt(searchParams.get('page') || '1');

  const handleSearch = (newQuery: string) => {
    setSearchParams({ q: newQuery, page: '1' });
  };

  return (
    <div>
      <input
        value={query}
        onChange={(e) => handleSearch(e.target.value)}
        placeholder="Search..."
      />
      <p>Page: {page}</p>
    </div>
  );
}
```

面包屑导航可以通过匹配当前路径生成：

```tsx
function Breadcrumbs() {
  const location = useLocation();
  const parts = location.pathname.split('/').filter(Boolean);

  return (
    <nav>
      <Link to="/">Home</Link>
      {parts.map((part, i) => {
        const path = '/' + parts.slice(0, i + 1).join('/');
        return (
          <span key={path}>
            {' / '}
            <Link to={path}>{part}</Link>
          </span>
        );
      })}
    </nav>
  );
}
```

## 实际开发中的应用 / 常见问题

### 社区常见问题

**Q: Hash 路由和 History 路由实际项目中怎么选？**

**A**: 绝大多数项目都应该使用 History 路由(BrowserRouter)。只有当后端无法配置路由回退(如某些 GitHub Pages 部署)或项目不需要 SEO 时，才使用 Hash 路由。

**Q: React Router v6 中 Navigate 组件和 useNavigate Hook 有什么区别？**

**A**: `Navigate` 是声明式组件，适合在 JSX 中进行条件跳转(如路由守卫)。`useNavigate` 是编程式 Hook，适合在事件处理或副作用中跳转。

### 踩坑经验

React Router v6 不再支持相对路径 `<Route path>`，所有路径建议写成绝对路径。嵌套路由中使用 `..` 可以返回上级相对路径。

使用 `lazy` 进行路由拆分时，如果组件抛出异步异常导致 chunk 加载失败，React 不会自动重试。建议在 `Suspense` 外层添加错误边界，并在边界中提供"刷新页面"等恢复操作。

当使用 `useSearchParams` 时，`setSearchParams` 的第二个参数 `{ replace: true }` 可以防止在浏览器历史中留下多余的记录，配合搜索输入做好防抖。
