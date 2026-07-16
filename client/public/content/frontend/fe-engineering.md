---
title: 前端工程化：构建与模块化
category: frontend
level: intermediate
readMinutes: 16
tags: "Vite, Webpack, 模块化, 工程化"
summary: 理解 ESM、打包器与现代化构建工具链。
order: 4
---

## 一、模块化演进

从 IIFE → CommonJS（Node，同步） → AMD → **ES Module**（浏览器原生 `import/export`）。现代前端统一用 ESM。

```
// math.js
export const add = (a, b) => a + b;
// main.js
import { add } from "./math.js";
```

## 二、打包器做什么

-   依赖图解析、Tree Shaking（剔除未用代码）
-   代码分割（Code Splitting）、懒加载
-   转译（Babel/TS）、压缩、HMR 热更新

## 三、Vite：下一代构建工具

开发期利用浏览器原生 ESM + esbuild 极速启动，无需打包；生产期用 Rollup 打包：

```
npm create vite@latest
npm run dev      # 秒级启动
npm run build    # Rollup 产物
```

对比 Webpack（成熟、配置重、生态大）与 Vite（快、约定优于配置），新项目优先 Vite。
