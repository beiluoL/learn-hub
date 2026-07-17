---
title: 前端工程化
category: interview
module: iv-fe
subcat: roadmap
timeline: false
level: medium
tier: extra
readMinutes: 10
tags: "前端面试, 工程化, 构建"
summary: 构建工具、模块化与 CI
order: 7
---

- 模块化：ESM / CommonJS 差异
- Webpack 打包 vs Vite 基于 ESM 的开发服务
- Tree Shaking 依赖 ESM 静态分析
- 代码分割、懒加载优化首屏

```javascript
// 动态导入实现懒加载
const mod = await import('./heavy.js');
mod.run();
```

> Vite 生产环境仍用 Rollup 打包。

**自查清单**
- [ ] 能说 ESM 与 CJS 区别
- [ ] 能说 Tree Shaking
