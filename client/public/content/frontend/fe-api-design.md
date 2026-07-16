---
title: 前端 API 通信方案对比：REST、GraphQL 与 tRPC
category: frontend
level: intermediate
readMinutes: 18
tags: "API, REST, GraphQL, tRPC, 数据请求"
summary: 前端 API 通信方案对比：REST、GraphQL 与 tRPC。
order: 33
prereq: frontend/fe-react
---

## REST 请求封装

REST 是前后端通信的基础，封装好请求层可以统一处理错误、Token 刷新、请求拦截等。

```typescript
// 请求封装示例
class HttpClient {
  private baseUrl: string;
  private token: string | null = null;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  setToken(token: string) {
    this.token = token;
  }

  private async request<T>(
    path: string,
    options: RequestInit = {}
  ): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...((options.headers as Record<string, string>) || {}),
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(`${this.baseUrl}${path}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new ApiError(response.status, error.message || 'Request failed');
    }

    return response.json();
  }

  get<T>(path: string) {
    return this.request<T>(path);
  }

  post<T>(path: string, body: unknown) {
    return this.request<T>(path, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }
}

class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}
```

## React Query / TanStack Query

React Query(现名 TanStack Query)管理服务端状态，提供缓存、自动重新获取、乐观更新等功能。

### 基础用法

```tsx
import { QueryClient, QueryClientProvider, useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,  // 5 分钟内数据视为新鲜
      refetchOnWindowFocus: false, // 窗口聚焦时不自动重新获取
    },
  },
});

// 查询
function UserList() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['users'],
    queryFn: () => fetch('/api/users').then((res) => res.json()),
  });

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <ul>
      {data.map((user: any) => (
        <li key={user.id}>{user.name}</li>
      ))}
    </ul>
  );
}

// 变更 + 乐观更新
function CreateUserForm() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (user: any) =>
      fetch('/api/users', {
        method: 'POST',
        body: JSON.stringify(user),
      }).then((res) => res.json()),
    onMutate: async (newUser) => {
      // 取消正在进行中的查询
      await queryClient.cancelQueries({ queryKey: ['users'] });
      // 保存旧数据
      const previous = queryClient.getQueryData(['users']);
      // 乐观更新 UI
      queryClient.setQueryData(['users'], (old: any) => [...old, newUser]);
      return { previous };
    },
    onError: (_err, _newUser, context) => {
      // 回滚到旧数据
      queryClient.setQueryData(['users'], context?.previous);
    },
    onSettled: () => {
      // 最后重新获取以保证数据一致
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        mutation.mutate({
          name: formData.get('name'),
        } as any);
      }}
    >
      <input name="name" placeholder="User name" />
      <button type="submit" disabled={mutation.isPending}>
        {mutation.isPending ? 'Creating...' : 'Create'}
      </button>
      {mutation.error && <p>Error: {mutation.error.message}</p>}
    </form>
  );
}
```

### 关键概念

- **staleTime**: 数据变"旧"的时间。在 staleTime 内，React Query 不会发起新请求
- **gcTime**: 数据被回收(从缓存移除)的时间
- **乐观更新**: 先假设操作成功更新 UI，失败后回滚
- **依赖查询**: `enabled` 选项控制查询是否执行

## GraphQL 与 Apollo Client

GraphQL 允许客户端精确指定所需数据，避免 over-fetching 和 under-fetching。

```tsx
import { ApolloClient, InMemoryCache, ApolloProvider, gql, useQuery } from '@apollo/client';

const client = new ApolloClient({
  uri: '/graphql',
  cache: new InMemoryCache(),
});

const GET_USERS = gql`
  query GetUsers($limit: Int!) {
    users(limit: $limit) {
      id
      name
      email
      posts {
        title
      }
    }
  }
`;

function Users() {
  const { data, loading, error } = useQuery(GET_USERS, {
    variables: { limit: 10 },
  });

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error!</div>;

  return (
    <ul>
      {data.users.map((user) => (
        <li key={user.id}>
          {user.name} - {user.posts.length} posts
        </li>
      ))}
    </ul>
  );
}
```

## tRPC: 端到端类型安全

tRPC 让你无需定义 API Schema 或生成客户端代码，就能获得从前端到后端的完整类型安全。

```typescript
// server/trpc.ts -- 服务端
import { initTRPC } from '@trpc/server';
import { z } from 'zod';

const t = initTRPC.create();

export const router = t.router;
export const publicProcedure = t.procedure;

export const appRouter = router({
  getUser: publicProcedure
    .input(z.string())
    .query(({ input }) => {
      return { id: input, name: 'Alice' };
    }),
  createUser: publicProcedure
    .input(z.object({ name: z.string().min(3), email: z.string().email() }))
    .mutation(({ input }) => {
      // 创建用户...
      return { id: '1', ...input };
    }),
});

export type AppRouter = typeof appRouter;
```

```tsx
// client/App.tsx -- 客户端
import { createTRPCReact } from '@trpc/react-query';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { httpBatchLink } from '@trpc/client';
import type { AppRouter } from '../server/trpc';

const trpc = createTRPCReact<AppRouter>();

const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({ url: '/api/trpc' }),
  ],
});

function UserProfile({ userId }: { userId: string }) {
  // 前端自动推断类型！
  const user = trpc.getUser.useQuery(userId);

  // 类型安全的变更
  const createUser = trpc.createUser.useMutation();

  return (
    <div>
      <p>{user.data?.name}</p>
    </div>
  );
}

function App() {
  const queryClient = new QueryClient();
  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <UserProfile userId="1" />
      </QueryClientProvider>
    </trpc.Provider>
  );
}
```

## BFF 模式

BFF (Backend for Frontend) 在前端和后端微服务之间增加一个中间层，专门为前端定制接口。

优势：聚合多个后端服务的数据、裁剪响应字段、隐藏微服务细节、统一认证授权。Next.js 的 API Route 就天然适合作为 BFF 层。

## 错误处理与重试策略

```typescript
// Fetch 封装的重试逻辑
async function fetchWithRetry(
  url: string,
  options: RequestInit = {},
  retries = 3,
  backoff = 1000
): Promise<Response> {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, options);

      // 只重试服务端错误和网络错误
      if (response.status >= 500 || response.status === 0) {
        throw new Error(`Server error: ${response.status}`);
      }

      return response;
    } catch (error) {
      if (i === retries - 1) throw error;
      // 指数退避
      await new Promise((r) => setTimeout(r, backoff * Math.pow(2, i)));
    }
  }
  throw new Error('Max retries exceeded');
}
```

## 实际开发中的应用 / 常见问题

### 社区常见问题

**Q: REST、GraphQL 和 tRPC 怎么选？**

**A**: 对外 API 使用 REST。需要灵活数据获取且多端共享接口使用 GraphQL。全栈 TypeScript 项目(前后端统一类型)使用 tRPC。内部产品用 tRPC + React Query，对外产品用 REST + React Query。

**Q: React Query 和 SWR 有什么区别？**

**A**: SWR 更轻量，适合简单场景。React Query 功能更全面(乐观更新、无限加载、devtools)。两者核心机制类似(stale-while-revalidate)，个人项目用 SWR，团队项目用 React Query。

### 踩坑经验

React Query 中 `queryKey` 的设计至关重要。它决定了缓存的粒度。推荐使用层级化 key：`['users', 'list']`、`['users', 'detail', userId]`。当用户详情更新时，可以通过 `queryClient.invalidateQueries({ queryKey: ['users', 'detail'] })` 精确清理相关缓存。

使用 GraphQL 时，注意 N+1 查询问题。虽然 GraphQL 的 DataLoader 可以在服务端批量解决，但在前端使用 Apollo Client 时，缓存策略需要合理配置。`fetchPolicy` 有多个选项(cache-first/cache-only/network-only/cache-and-network)，选择合适的策略能大幅减少请求。

tRPC 虽然类型安全，但整个类型系统的复杂性集中在服务端。Router 层级不宜过深。如果项目需要开放 API 给第三方使用，tRPC 不适合作为对外接口——这时考虑用 tRPC 生成 OpenAPI Schema 或单独提供 REST 端点。
