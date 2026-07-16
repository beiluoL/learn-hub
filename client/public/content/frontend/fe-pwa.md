---
title: PWA 渐进式 Web 应用与离线化
category: frontend
level: intermediate
readMinutes: 16
tags: "PWA, Service Worker, 离线, 缓存"
summary: PWA 渐进式 Web 应用与离线化。
order: 35
prereq:
---

## PWA 核心要素

PWA (Progressive Web App) 让 Web 应用拥有近似原生应用的体验。三个核心技术：

| 技术 | 作用 |
|------|------|
| HTTPS | 安全传输，Service Worker 的前提条件 |
| Service Worker | 后台脚本，拦截网络请求，实现离线缓存和推送 |
| Web App Manifest | 定义应用名称、图标、启动方式，实现可安装 |

## Service Worker 生命周期

Service Worker 的生命周期独立于页面，理解其三个阶段是正确使用的前提。

```javascript
// sw.js — Service Worker 脚本
const CACHE_NAME = 'app-cache-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/styles/main.css',
  '/scripts/app.js',
  '/images/logo.png',
];

// 1. Install — 预缓存核心资源
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Opened cache');
      return cache.addAll(urlsToCache);
    })
  );
  // 立即激活，不等待旧 SW 释放
  self.skipWaiting();
});

// 2. Activate — 清理旧缓存
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  // 立即接管所有页面
  self.clients.claim();
});

// 3. Fetch — 拦截请求，决定缓存策略
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request);
    })
  );
});
```

## 缓存策略

不同的资源适合不同的缓存策略。

### Cache First (缓存优先)

适用于不常变化的静态资源(Logo、字体、CSS/JS bundle)。先检查缓存，缓存没有才走网络。

```javascript
// Cache First
const cacheFirst = async (request) => {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    const cache = await caches.open('static-v1');
    cache.put(request, response.clone());
    return response;
  } catch (error) {
    // 离线且缓存中没有，返回降级页面
    return caches.match('/offline.html');
  }
};
```

### Network First (网络优先)

适用于需要最新数据的 API 请求。先尝试网络，网络失败后使用缓存。

```javascript
// Network First
const networkFirst = async (request) => {
  const cache = await caches.open('dynamic-v1');

  try {
    const response = await fetch(request);
    cache.put(request, response.clone());
    return response;
  } catch (error) {
    const cached = await cache.match(request);
    if (cached) return cached;
    throw error;
  }
};
```

### Stale While Revalidate (后台更新)

优先返回缓存(快速响应)，同时在后台发起网络请求更新缓存。适用于需要快速展示但又要保证数据新鲜度的场景(如文章内容)。

```javascript
const staleWhileRevalidate = async (request) => {
  const cache = await caches.open('api-v1');
  const cached = await cache.match(request);

  const fetchPromise = fetch(request)
    .then((response) => {
      cache.put(request, response.clone());
      return response;
    })
    .catch(() => cached);

  // 立即返回缓存数据，同时在后台更新
  return cached || fetchPromise;
};
```

### 策略路由

根据请求类型使用不同策略：

```javascript
self.addEventListener('fetch', (event) => {
  const { pathname } = new URL(event.request.url);

  // 静态资源：Cache First
  if (pathname.match(/\.(js|css|png|jpg|svg|woff2)$/)) {
    event.respondWith(cacheFirst(event.request));
  }
  // API 数据：Network First
  else if (pathname.startsWith('/api/')) {
    event.respondWith(networkFirst(event.request));
  }
  // HTML 页面：Stale While Revalidate
  else if (event.request.mode === 'navigate') {
    event.respondWith(staleWhileRevalidate(event.request));
  }
});
```

## 离线页面

```javascript
// 在 install 时预缓存离线页面
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open('offline-v1').then((cache) => {
      return cache.addAll(['/', '/offline.html']);
    })
  );
});

// 导航请求失败时返回离线页面
self.addEventListener('fetch', (event) => {
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match('/offline.html');
      })
    );
  }
});
```

## 推送通知

```javascript
// 客户端请求通知权限并订阅
async function subscribeToPush() {
  const registration = await navigator.serviceWorker.ready;

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    console.log('Permission denied');
    return;
  }

  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array('YOUR_PUBLIC_KEY'),
  });

  // 将 subscription 发送到服务端
  await fetch('/api/push/subscribe', {
    method: 'POST',
    body: JSON.stringify(subscription),
  });
}
```

## Web App Manifest

```json
{
  "name": "My PWA App",
  "short_name": "MyApp",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#1890ff",
  "orientation": "portrait-primary",
  "icons": [
    {
      "src": "/icons/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    }
  ]
}
```

HTML 中引用：

```html
<link rel="manifest" href="/manifest.json" />
<meta name="theme-color" content="#1890ff" />
```

## Workbox: Service Worker 工具链

手动编写 Service Worker 的缓存逻辑容易出错，Google 的 Workbox 提供了更安全的封装。

```javascript
// 使用 Workbox CLI 或 webpack 插件自动生成
import { precacheAndRoute } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { CacheFirst, NetworkFirst, StaleWhileRevalidate } from 'workbox-strategies';

// 预缓存 webpack 打包的资源
precacheAndRoute(self.__WB_MANIFEST);

// 图片：Cache First
registerRoute(
  ({ request }) => request.destination === 'image',
  new CacheFirst({ cacheName: 'images' })
);

// API：Network First
registerRoute(
  ({ url }) => url.pathname.startsWith('/api/'),
  new NetworkFirst({ cacheName: 'api-responses' })
);

// HTML：Stale While Revalidate
registerRoute(
  ({ request }) => request.mode === 'navigate',
  new StaleWhileRevalidate({ cacheName: 'pages' })
);
```

## Next.js PWA 示例

使用 `next-pwa` 插件快速添加到 Next.js 项目中。

```javascript
// next.config.js
const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
});

module.exports = withPWA({
  // Next.js 配置
});
```

## 实际开发中的应用 / 常见问题

### 社区常见问题

**Q: PWA 能在 iOS 上使用吗？**

**A**: 可以，但功能受限。iOS 从 11.3 开始支持 Service Worker 和 Manifest，但不支持推送通知(Web Push，iOS 16.4+ 才支持)。可安装性在 Safari 中以"添加到主屏幕"形式存在。缓存限制较严格，每个 Service Worker 的存储有上限。

**Q: Service Worker 更新后用户看到的是旧版本怎么办？**

**A**: 使用 `self.skipWaiting()` + `self.clients.claim()` 可以让新 SW 立即激活。但更推荐的方式是在页面中监听 `updatefound` 事件，提示用户刷新页面，避免中途切换导致问题。

```javascript
navigator.serviceWorker.ready.then((registration) => {
  if (registration.waiting) {
    // 提示用户: "New version available, click to refresh"
  }
  registration.addEventListener('updatefound', () => {
    const newWorker = registration.installing;
    newWorker?.addEventListener('statechange', () => {
      if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
        showUpdateBanner();
      }
    });
  });
});
```

### 踩坑经验

Service Worker 只能在 HTTPS(或 localhost)环境下注册。证书问题会导致静默失败，开发时没有硬性限制但部署必须 HTTPS。

缓存空间有限，浏览器会根据存储压力自动清理源站的缓存。不要依赖 Service Worker 做持久化存储，对于重要数据应结合 IndexedDB。

Service Worker 脚本文件的缓存由浏览器控制，最大缓存时间为 24 小时(部分浏览器 86400 秒)。可通过 `Cache-Control` header 缩短。如果不设置，即使你更新了 `sw.js`，浏览器可能仍使用旧版本。这是为什么 Workbox 默认使用 hash 文件名。
