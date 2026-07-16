---
title: 前端构建工具原理与对比
category: frontend
level: intermediate
readMinutes: 18
tags: "构建, Vite, Webpack, esbuild, 打包"
summary: 前端构建工具原理与对比。
order: 25
prereq: frontend/fe-engineering
---

## 模块化历史

理解构建工具之前，有必要回顾前端模块化的演进历程。

| 方案 | 年代 | 特点 |
|------|------|------|
| IIFE | 早期 | 立即执行函数，闭包隔离，无依赖管理 |
| CommonJS | Node.js 初期 | `require`/`module.exports`，同步加载 |
| AMD | RequireJS 时代 | `define`，异步加载，适合浏览器 |
| ESM | 现代标准 | `import`/`export`，静态分析，Tree Shaking |

ES Module 是当前标准，所有现代构建工具都基于此。

```javascript
// CommonJS (Node.js)
const lodash = require('lodash');
module.exports = { name: 'MyModule' };

// ESM (现代标准)
import lodash from 'lodash';
export const name = 'MyModule';
```

## Webpack 核心机制

Webpack 将项目中的一切资源(JS/CSS/图片/字体)都视为"模块"，通过 Loader 和 Plugin 系统处理。

### 核心概念

- **Entry**: 构建入口文件
- **Output**: 打包产物输出路径
- **Loader**: 转换非 JS 文件(如 CSS Loader、TypeScript Loader)
- **Plugin**: 扩展构建功能(压缩、生成 HTML、注入变量)
- **Mode**: `development`/`production` 决定内置优化行为

```javascript
// webpack.config.js
const HtmlWebpackPlugin = require('html-webpack-plugin');
const path = require('path');

module.exports = {
  entry: './src/index.tsx',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].[contenthash].js',
    clean: true,
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
      {
        test: /\.module\.css$/,
        use: ['style-loader', {
          loader: 'css-loader',
          options: { modules: true },
        }],
      },
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  plugins: [
    new HtmlWebpackPlugin({ template: './public/index.html' }),
  ],
  optimization: {
    splitChunks: {
      chunks: 'all', // 提取公共依赖为独立 chunk
    },
  },
};
```

### Tree Shaking 与 Code Splitting

Tree Shaking 基于 ESM 的静态结构，在构建时移除未使用的代码。Webpack 通过 `production` 模式和 `sideEffects` 配置实现。

```json
{
  "sideEffects": ["*.css", "*.scss"]
}
```

Code Splitting 将代码拆分为多个 chunk，按需加载。

```tsx
const Dashboard = React.lazy(() =>
  import(/* webpackChunkName: "dashboard" */ './Dashboard')
);
```

## Vite 原理

Vite 由两部分组成：开发服务器使用原生 ESM 按需编译，生产构建使用 Rollup。

### 开发模式：按需编译

Vite 的开发服务器不需要打包整个项目。浏览器通过 `<script type="module">` 直接请求源文件，Vite 在中间层做实时转译(如 TypeScript、JSX)，实现毫秒级冷启动。

当文件变化时，Vite 只失效变化的模块，HMR 速度不受项目规模影响。

### 生产构建：Rollup

构建时 Vite 使用 Rollup 打包。Rollup 天然支持 ESM Tree Shaking，产物体积小。

```javascript
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
        },
      },
    },
  },
  server: {
    port: 3000,
    proxy: {
      '/api': 'http://localhost:8080',
    },
  },
});
```

## esbuild: 速度的秘密

esbuild 使用 Go 语言编写，利用多线程并行处理和内存高效的数据结构，实现了 Webpack 数十倍的构建速度。没有运行时、二进制直接执行、AST 并行解析。

```javascript
// esbuild 配置示例
import { build } from 'esbuild';

await build({
  entryPoints: ['src/index.tsx'],
  bundle: true,
  outfile: 'dist/bundle.js',
  loader: { '.tsx': 'tsx', '.css': 'css' },
  minify: true,
  sourcemap: true,
  platform: 'browser',
});
```

Vite 底层在开发模式下已经使用了 esbuild 来做预构建(pre-bundling)和 TypeScript 编译。

## Turbopack 与 Rspack

- **Turbopack**: Vercel 推出的基于 Rust 的增量打包器，Next.js 中的 Webpack 替代方案，强调增量计算
- **Rspack**: 字节跳动出品的 Rust 打包器，API 兼容 Webpack，迁移成本低

两者都处于快速迭代阶段，适合新项目尝试。

## 优化对比

| 特性 | Webpack | Vite | esbuild |
|------|---------|------|---------|
| 开发启动速度 | 慢(需打包) | 极快(按需编译) | 不适用(纯构建) |
| 生产构建速度 | 中 | 快(Rollup) | 极快 |
| 生态丰富度 | 极高 | 高 | 低 |
| 配置复杂度 | 高 | 低 | 低 |
| HMR 速度 | 随项目规模下降 | 恒定快速 | 不适用 |
| 学习曲线 | 陡峭 | 平缓 | 平缓 |

## 实际开发中的应用 / 常见问题

### 社区常见问题

**Q: 新项目应该选 Vite 还是 Webpack？**

**A**: 大多数新项目推荐 Vite，它有更好的开发体验和生产构建性能。但以下场景仍建议 Webpack：需要大量自定义构建逻辑、依赖复杂的老旧生态、公司内部的构建基础设施已基于 Webpack。

**Q: 为什么 Vite 开发快但生产构建不快？**

**A**: Vite 开发时的"快"是因为它不打包，直接利用浏览器原生 ESM 按需编译。生产构建使用 Rollup 仍然需要打包全部代码，所以速度不如 esbuild，但产物体积优于 esbuild。

### 踩坑经验

Webpack 的 `mode` 设为 `production` 会自动启用 Tree Shaking 和代码压缩，但不会自动处理 CSS 优化。需要单独配置 `css-minimizer-webpack-plugin`。

Vite 项目中引入 CommonJS 依赖时，Vite 会使用 esbuild 预构建将 CJS 转为 ESM。如果预构建失败(如动态 `require`)，需要在 `vite.config.ts` 中通过 `optimizeDeps.include` 显式声明。

使用 Webpack 时，`source-map` 类型的选择对构建速度影响巨大。开发用 `eval-cheap-module-source-map`，生产用 `hidden-source-map` 是不错的平衡。
