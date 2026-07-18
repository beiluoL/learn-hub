---
title: 第 8 章 · 实战项目
category: frontend
module: react
subcat: roadmap
level: advanced
readMinutes: 15
tags: "React, 实战, 项目, 部署"
summary: 把前面所学落到一个完整项目：项目结构规划、功能拆解、状态与路由设计，以及部署上线，让代码写进简历。
order: 10
prereq: frontend/react/roadmap/react-ch7-principle
---

学完框架只是「会工具」，做完整项目才是「会工程」。这一章讲怎么从 0 搭一个能写进简历的项目。

## 项目结构（推荐）

```text
src/
  components/      # 可复用 UI（Button/Modal/Card）
  features/        # 业务模块（auth/todos/cart）
  pages/           # 路由页（Home/Detail/Dashboard）
  hooks/           # 自定义 Hook（useFetch/useAuth）
  store/           # 全局状态（zustand）
  utils/           # 请求/格式化等纯函数
  router.jsx       # 路由表
  main.jsx         # 入口
```

原则：**按功能聚合**而非按文件类型平铺；公共 Logic 抽 `hooks`，公共 UI 抽 `components`。

## 功能拆解四步

1. **画界面**：列页面与组件树。
2. **定数据**：哪些用 `useState`、哪些进全局 store、哪些走接口。
3. **连路由**：哪些页需要守卫、哪些要懒加载。
4. **补细节**：加载态、空态、错误态、表单校验。

## 一个后台管理系统的设计要点

- 路由：`Layout`（侧边栏）包 `Outlet`，`/login` 独立；`/dashboard`、`/users` 加 `RequireAuth`。
- 状态：用户信息 + 权限进 Zustand；列表数据由各页 `useFetch` 维护。
- 表格/表单：用 Ant Design 的 `Table` / `Form`，减少造轮子。
- 请求：统一 `request.js`，错误集中处理、token 注入。

## 部署

- **Vercel / Netlify**：连 GitHub 仓库，push 即部署，零配置。
- **GitHub Pages**：需设 `base`（如 `/learn-hub/`），用 Actions 构建静态产物。
- 构建命令统一 `npm run build`，产物在 `dist/`。

## 让用户「看到你的能力」

- 代码放 GitHub，写清晰 README（功能、技术栈、运行方式、截图）。
- 区分「练手」与「作品」：至少做一个完整度高的项目（登录 + CRUD + 路由 + 状态 + 部署）。
- 写进简历时强调「解决了什么问题」，而非罗列技术名词。

## 后续可深挖

- 服务端渲染（Next.js）/ 静态生成。
- 组件库开发、Monorepo、微前端。
- 可视化（D3 / ECharts）、WebGL、PWA 离线。

## 小结

- 项目结构按功能聚合；Logic 抽 Hook、UI 抽组件。
- 先拆界面/数据/路由/细节，再动手。
- 部署选 Vercel；代码进 GitHub + 写 README，才是「完整交付」。

> React 路线到此闭环。下一步：挑一个项目真正做出来，并在本站的「在线运行」里多敲多练。
