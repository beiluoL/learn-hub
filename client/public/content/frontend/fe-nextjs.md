---
title: Next.js 服务端渲染与全栈开发
category: frontend
level: intermediate
readMinutes: 20
tags: "Next.js, SSR, SSG, ISR, App Router"
summary: Next.js 服务端渲染与全栈开发。
order: 22
prereq: frontend/fe-react
---

## 渲染策略：SSR / SSG / ISR

Next.js 提供了三种主要的渲染策略，理解它们的区别是选择合适方案的关键。

| 策略 | 全称 | 渲染时机 | 适用场景 |
|------|------|---------|---------|
| SSR | Server-Side Rendering | 每次请求时服务端渲染 | 个性化内容、实时数据 |
| SSG | Static Site Generation | 构建时生成静态页面 | 博客、文档、营销页 |
| ISR | Incremental Static Regeneration | 构建时 + 按时间间隔重新生成 | 内容更新不频繁的页面 |

### 策略选择原则

默认优先使用 SSG 以获得最佳性能。当页面内容需要在请求时决定(如用户个人信息)时使用 SSR。当静态内容需要定期更新(如文章列表)时使用 ISR。

## App Router vs Pages Router

Next.js 13 引入了 App Router，使用 `app/` 目录替代 `pages/` 目录，核心变化如下：

- **文件约定不同**: `page.tsx` 替代 `index.tsx`，`layout.tsx` 定义共享布局
- **Server Component 优先**: 默认组件都是服务端组件，无需客户端 JS
- **React 18 并发特性**: 原生支持 Streaming 和 Suspense

## Server Component vs Client Component

这是 App Router 中最核心的概念。Server Component 在服务端渲染，不能使用交互相关的 API(useState/useEffect/事件处理)；Client Component 使用 `'use client'` 指令标记，在浏览器中水合(Hydrate)。

```tsx
// app/page.tsx - Server Component (默认)
import { getPosts } from '@/lib/posts';
import { PostCard } from './PostCard';

export default async function HomePage() {
  const posts = await getPosts();

  return (
    <main className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Latest Posts</h1>
      <div className="grid gap-4 md:grid-cols-2">
        {posts.map((post) => (
          <PostCard key={post.slug} post={post} />
        ))}
      </div>
    </main>
  );
}
```

```tsx
// app/PostCard.tsx - Client Component
'use client';

import { useState } from 'react';

export function PostCard({ post }: { post: { title: string; slug: string; excerpt: string } }) {
  const [liked, setLiked] = useState(false);

  return (
    <div className="border rounded-lg p-4 hover:shadow-md transition-shadow">
      <h2 className="text-xl font-semibold">{post.title}</h2>
      <p className="text-gray-600 mt-2">{post.excerpt}</p>
      <button
        onClick={() => setLiked(!liked)}
        className={`mt-3 px-3 py-1 rounded text-sm ${
          liked ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-600'
        }`}
      >
        {liked ? 'Liked' : 'Like'}
      </button>
    </div>
  );
}
```

## 数据获取与缓存

在 App Router 中，`fetch` 被扩展了缓存控制选项。Next.js 会自动对 GET 请求进行缓存，可以通过选项控制行为。

```tsx
// 按需重新验证：请求一次后缓存，60 秒后重新验证
const res = await fetch('https://api.example.com/data', {
  next: { revalidate: 60 },
});

// 完全禁用缓存：每次请求都重新获取
const res = await fetch('https://api.example.com/data', {
  cache: 'no-store',
});
```

## 路由体系

App Router 的文件约定路由提供了 layout、loading、error 等高级模式。

```tsx
// app/blog/[slug]/layout.tsx - 嵌套布局
export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex gap-8">
      <aside className="w-64 shrink-0">
        <nav className="sticky top-4">
          <h3 className="font-bold mb-2">Categories</h3>
          {/* 侧边栏导航 */}
        </nav>
      </aside>
      <article className="flex-1">{children}</article>
    </div>
  );
}
```

```tsx
// app/blog/[slug]/loading.tsx - Suspense 加载状态
export default function Loading() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="h-8 bg-gray-200 rounded w-3/4" />
      <div className="h-4 bg-gray-200 rounded w-full" />
      <div className="h-4 bg-gray-200 rounded w-5/6" />
    </div>
  );
}
```

## API Route

Next.js 的 Route Handler 让你在同一个项目中编写后端 API。

```tsx
// app/api/posts/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1');

  const posts = await fetchPosts({ page });

  return NextResponse.json({
    data: posts,
    nextPage: posts.length === 10 ? page + 1 : null,
  });
}

export async function POST(request: NextRequest) {
  const body = await request.json();

  // 基本验证
  if (!body.title || !body.content) {
    return NextResponse.json(
      { error: 'Title and content are required' },
      { status: 400 }
    );
  }

  const post = await createPost(body);
  return NextResponse.json(post, { status: 201 });
}
```

## 图片优化与部署

`next/image` 组件提供了自动格式转换(WebP/AVIF)、懒加载、占位模糊、尺寸优化等功能。

```tsx
import Image from 'next/image';

function HeroBanner() {
  return (
    <div className="relative w-full h-96">
      <Image
        src="/hero.jpg"
        alt="Hero"
        fill
        className="object-cover"
        priority // 首屏图片优先加载
        sizes="100vw"
      />
    </div>
  );
}
```

部署到 Vercel 是最简单的方式：连接 Git 仓库后自动构建和部署。也可以部署到 Docker、Node.js 服务器或其他 Serverless 平台。

## 实际开发中的应用 / 常见问题

### 社区常见问题

**Q: 什么时候应该用 Client Component 而不是 Server Component？**

**A**: 当组件需要交互(事件处理)、使用浏览器 API、使用 React Hooks、或者使用仅客户端支持的库时。把交互下沉到尽可能小的组件中，外层保持 Server Component。

**Q: ISR 和 SSG 实际如何选择？**

**A**: 对于内容完全在构建时就能确定且不会变化的页面(如关于页面)使用 SSG。对于内容会阶段性更新但不要求实时(如博客文章)使用 ISR。ISR 的 revalidate 时间需要根据内容更新频率设置。

### 踩坑经验

在 App Router 中，`getStaticProps` 和 `getServerSideProps` 已不再使用。数据获取直接在 Server Component 中使用异步函数。Server Component 和 Client Component 的嵌套规则：可以在 Server Component 中导入 Client Component，反之不行。但如果 Server Component 作为 children prop 传给 Client Component 是允许的。

`next/dynamic` 是代码拆分的利器，对于体积较大的第三方组件使用动态导入以避免影响首屏加载时间。同时可以配合 `loading` 属性提供加载占位。
