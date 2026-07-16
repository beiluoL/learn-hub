---
title: 前端错误监控与性能追踪
category: frontend
level: intermediate
readMinutes: 16
tags: "监控, Sentry, 埋点, 性能监控"
summary: 前端错误监控与性能追踪。
order: 28
prereq: frontend/fe-js-core
---

## 错误捕获机制

前端错误捕获是监控体系的基础。浏览器提供了多层次的错误捕获能力。

### 全局错误捕获

```javascript
// 同步错误
window.onerror = function (message, source, lineno, colno, error) {
  // 上报到监控服务
  reportError({
    type: 'js_error',
    message: message.toString(),
    stack: error?.stack,
    source,
    line: lineno,
    col: colno,
  });
};

// Promise 未捕获异常
window.addEventListener('unhandledrejection', (event) => {
  reportError({
    type: 'promise_error',
    message: event.reason?.message,
    stack: event.reason?.stack,
  });
  event.preventDefault(); // 阻止控制台默认错误
});
```

### ErrorBoundary: React 错误边界

错误边界捕获子组件树中的渲染错误，防止整个应用崩溃。

```tsx
import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // 上报错误详情
    this.props.onError?.(error, errorInfo);
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div style={{ padding: 20, textAlign: 'center' }}>
          <h2>Something went wrong</h2>
          <button onClick={() => this.setState({ hasError: false, error: null })}>
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// 使用
function App() {
  return (
    <ErrorBoundary
      fallback={<div>Page crashed, please refresh.</div>}
      onError={(error, info) => {
        // 上报到 Sentry 或自研监控
        Sentry.captureException(error, {
          contexts: { react: info },
        });
      }}
    >
      <MainContent />
    </ErrorBoundary>
  );
}
```

## Sentry 接入与配置

Sentry 是开源的前端监控平台，支持错误追踪、性能监控、Session Replay。

```bash
npm install @sentry/react
```

```tsx
// 初始化 Sentry
import * as Sentry from '@sentry/react';

Sentry.init({
  dsn: 'https://xxx@xxx.ingest.sentry.io/xxx',
  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration(),
  ],
  tracesSampleRate: 0.1,      // 性能追踪采样率 10%
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0, // 错误时 100% 录制
  environment: process.env.NODE_ENV,
  release: process.env.APP_VERSION,
});
```

**SourceMap 上传**: 生产环境不建议公开部署 SourceMap。通过 Sentry CLI 将 SourceMap 上传到 Sentry 服务器，DevTools 无法访问但 Sentry 能还原堆栈。

```bash
sentry-cli releases files $VERSION upload-sourcemaps ./dist --url-prefix '~/'
```

## 自研监控核心原理

如果你需要自建监控系统，核心实现如下：

```typescript
interface ErrorReport {
  type: 'js_error' | 'resource_error' | 'promise_error' | 'http_error';
  message: string;
  stack?: string;
  url: string;
  timestamp: number;
  userAgent: string;
  breadcrumbs: Breadcrumb[];
}

class MonitorSDK {
  private breadcrumbs: Breadcrumb[] = [];
  private dsn: string;

  constructor(config: { dsn: string }) {
    this.dsn = config.dsn;
    this.init();
  }

  private init() {
    // 全局错误
    window.onerror = (msg, source, line, col, error) => {
      this.report({
        type: 'js_error',
        message: msg as string,
        stack: error?.stack,
      });
    };

    // Promise 错误
    window.addEventListener('unhandledrejection', (event) => {
      this.report({
        type: 'promise_error',
        message: event.reason?.message,
        stack: event.reason?.stack,
      });
    });

    // 劫持 console.error(可选)
    const originalError = console.error;
    console.error = (...args: any[]) => {
      this.addBreadcrumb('console.error', args);
      originalError.apply(console, args);
    };
  }

  addBreadcrumb(category: string, data: any) {
    this.breadcrumbs.push({
      category,
      data,
      timestamp: Date.now(),
    });
    // 只保留最近 20 条
    if (this.breadcrumbs.length > 20) {
      this.breadcrumbs.shift();
    }
  }

  private report(error: Omit<ErrorReport, 'url' | 'timestamp' | 'userAgent' | 'breadcrumbs'>) {
    const payload: ErrorReport = {
      ...error,
      url: window.location.href,
      timestamp: Date.now(),
      userAgent: navigator.userAgent,
      breadcrumbs: [...this.breadcrumbs],
    };

    // 使用 sendBeacon 确保页面关闭时也能上报
    if (navigator.sendBeacon) {
      navigator.sendBeacon(this.dsn, JSON.stringify(payload));
    } else {
      fetch(this.dsn, {
        method: 'POST',
        body: JSON.stringify(payload),
        keepalive: true,
      });
    }
  }
}
```

## 核心 Web 性能指标

Google 的 Web Vitals 定义了用户体验的关键指标。

| 指标 | 全称 | 含义 | 良好阈值 |
|------|------|------|---------|
| LCP | Largest Contentful Paint | 最大内容绘制时间 | < 2.5s |
| FID | First Input Delay | 首次输入延迟 | < 100ms |
| INP | Interaction to Next Paint | 交互到下次绘制 | < 200ms |
| CLS | Cumulative Layout Shift | 累计布局偏移 | < 0.1 |

### PerformanceObserver 采集

```javascript
// LCP
new PerformanceObserver((list) => {
  const entries = list.getEntries();
  const lastEntry = entries[entries.length - 1];
  console.log('LCP:', lastEntry.startTime);
}).observe({ type: 'largest-contentful-paint', buffered: true });

// CLS
let clsValue = 0;
new PerformanceObserver((list) => {
  for (const entry of list.getEntries()) {
    if (!(entry as any).hadRecentInput) {
      clsValue += (entry as any).value;
    }
  }
  console.log('CLS:', clsValue);
}).observe({ type: 'layout-shift', buffered: true });
```

## 埋点设计

用户行为埋点帮助理解产品使用情况。

```typescript
// 埋点 SDK 核心
class TrackerSDK {
  private events: TrackEvent[] = [];
  private timer: number | null = null;

  track(event: string, properties?: Record<string, any>) {
    this.events.push({
      event,
      properties,
      timestamp: Date.now(),
      page: window.location.pathname,
    });

    // 批量上报(每 5 秒或超过 10 条)
    if (this.events.length >= 10) {
      this.flush();
    } else if (!this.timer) {
      this.timer = window.setTimeout(() => this.flush(), 5000);
    }
  }

  private async flush() {
    const batch = this.events.splice(0);
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    if (batch.length === 0) return;

    await fetch('/api/track', {
      method: 'POST',
      body: JSON.stringify(batch),
      headers: { 'Content-Type': 'application/json' },
    }).catch(() => {
      // 失败时重新放回队列
      this.events.unshift(...batch);
    });
  }
}

// 页面曝光埋点
const tracker = new TrackerSDK();
tracker.track('page_view', { title: document.title });
tracker.track('button_click', { buttonId: 'submit', page: '/checkout' });
```

## 日志分级与采样

```typescript
enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

const logLevel: LogLevel =
  process.env.NODE_ENV === 'production' ? LogLevel.WARN : LogLevel.DEBUG;

function log(level: LogLevel, message: string, extra?: any) {
  if (level < logLevel) return;

  // 采样：只有 10% 的 DEBUG 日志上报
  if (level === LogLevel.DEBUG && Math.random() > 0.1) return;

  // 上报逻辑...
}
```

## 实际开发中的应用 / 常见问题

### 社区常见问题

**Q: 前端监控和后端监控需要打通吗？**

**A**: 强烈建议打通。通过 traceId 串联前端的网络请求和后端的处理链路，可以快速定位问题是在前端还是后端。Sentry 的 Distributed Tracing 就是做这个的。

**Q: 采样率如何设置？**

**A**: 错误类事件 100% 采集。性能数据 5%-10% 采样。用户行为埋点对核心流程 100% 采集，非核心流程 10%-50%。在客户端使用 `Math.random() < sampleRate` 决定是否上报。

### 踩坑经验

`window.onerror` 无法捕获跨域脚本的详细错误信息(只会显示 "Script error")。解决方案：在 `<script>` 标签上添加 `crossorigin="anonymous"`，并且 CDN 返回 `Access-Control-Allow-Origin` Header。

Sentry 去重做得好不代表没有问题。同一行代码可能在不同场景下抛出不同的错误，去重可能导致信息丢失。合理配置 `beforeSend` 钩子，在去重基础上保留关键上下文(当前 URL、用户操作面包屑)。

生产环境 `console.log` 应该被移除或降级。大量日志输出不仅影响性能，还可能泄露敏感信息。如果使用 Sentry 的 `breadcrumbs`，建议限制面包屑数量和内容大小。
