---
title: 前端性能优化实战
category: frontend
level: advanced
readMinutes: 17
tags: "性能, LCP, 懒加载, 缓存"
summary: 从加载、渲染到运行时，系统性提升页面性能。
order: 5
---

## 一、加载性能

-   代码分割 + 路由级懒加载（`React.lazy` / 动态 `import()`）
-   图片用 `webp`、`loading="lazy"`、响应式 `srcset`
-   资源走 CDN + HTTP 缓存（强缓存 Cache-Control，协商缓存 ETag）

## 二、Core Web Vitals

| 指标 | 含义 | 目标 |
| --- | --- | --- |
| LCP | 最大内容绘制 | < 2.5s |
| INP | 交互到响应 | < 200ms |
| CLS | 累积布局偏移 | < 0.1 |

## 三、运行时优化

-   防抖（debounce）/ 节流（throttle）控制高频事件
-   虚拟列表渲染长列表（只渲染可视区）
-   Web Worker 处理重计算，避免阻塞主线程
-   合理使用 `requestAnimationFrame`

```
function debounce(fn, wait) {
  let t;
  return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), wait); };
}
```
