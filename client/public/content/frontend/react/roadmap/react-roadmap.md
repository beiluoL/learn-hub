---
title: React 系统学习路线（含打卡清单）
category: frontend
module: react
subcat: roadmap
timeline: true
level: beginner
readMinutes: 12
tags: "React, 学习路线, 路线图, 打卡"
summary: 从前置基础到实战项目的 9 阶段 React 学习路线，每个阶段拆成可勾选任务，方便对照打卡。
order: 1
---

这份路线把 React 学习拆成 9 个阶段，每个阶段都给出**具体任务**与**练手目标**。建议每完成一项就勾掉一项（`- [x]`），每周保持 1~2 小时节奏，边看边敲。

## 0. 前置基础（必须扎实）

- [ ] HTML 语义化标签与表单：`form` / `input` / `label` / `select`
- [ ] CSS 盒模型、flex、grid、响应式与 CSS 变量
- [ ] JavaScript(ES6+)：解构、箭头函数、模板字符串、`map/filter/reduce`、模块化 `import/export`、Promise/async
- [ ] 终端基本操作、`npm/pnpm` 装包、Git 提交
- [ ] 练手：纯 HTML/CSS/JS 写一个 Todo 或轮播图

## 1. React 核心基础

- [ ] 理解「组件即函数、JSX 即 UI 描述」的心智模型
- [ ] 用 Vite 跑起第一个 React 项目：`createRoot.render(<App/>)`
- [ ] 函数组件 + `props` 传参；`{ }` 里写表达式
- [ ] 条件渲染（三元 / `&&`）、列表渲染（`.map` + `key`）
- [ ] 练手：把阶段 0 的 Todo 用 React 重写，数据写死在组件里

## 2. 组件化开发

- [ ] `props` 父传子（类型校验用 TypeScript 或 `prop-types`）
- [ ] `children` 插槽式组合、组件复用
- [ ] 列表渲染的稳定 `key`；为什么不要用数组下标当 key
- [ ] 受控组件（`value` + `onChange`）；表单处理
- [ ] 练手：拆出可复用列表项组件 + 分页组件

## 3. Hooks 体系（React 重点）

- [ ] `useState` 状态与不可变更新；`setState(prev => ...)`
- [ ] `useEffect` 副作用与清理函数、依赖数组
- [ ] `useRef` 引用 DOM / 存可变值
- [ ] `useMemo` / `useCallback` 性能缓存；`React.memo`
- [ ] 规则：只在顶层调用 Hook；自定义 Hook 以 `use` 开头
- [ ] 练手：用 Hooks 重写阶段 2 组件，抽一个 `useFetch`

## 4. 状态管理

- [ ] 状态提升（子传父用回调 props）
- [ ] `useContext` + `useReducer` 跨层共享
- [ ] 第三方：Zustand（轻量）/ Redux Toolkit（约定重）
- [ ] 持久化到 `localStorage`
- [ ] 练手：把用户信息、购物车抽到 Zustand

## 5. React Router 路由

- [ ] `createBrowserRouter` / `<Routes><Route>` 路由表
- [ ] `<Link>` / `useNavigate` 导航；`useParams` 取动态参数
- [ ] 嵌套路由、布局路由、编程式导航
- [ ] 路由守卫（登录鉴权）、路由懒加载 `React.lazy`
- [ ] 练手：多页小站（首页/列表/详情/关于）+ 登录守卫

## 6. 生态与工程化

- [ ] Vite 配置（别名、代理跨域、`.env`）
- [ ] TypeScript 接入：`<T,>` 泛型、事件类型
- [ ] 网络请求 `fetch` / axios 封装
- [ ] UI 库选 1~2 个：Ant Design、MUI、shadcn/ui
- [ ] 测试：Vitest + React Testing Library
- [ ] 练手：Ant Design + TS 搭后台骨架

## 7. 进阶原理

- [ ] 渲染(_render_)与提交(_commit_)两阶段；Fiber 架构
- [ ] 协调(Reconciliation)与 diff；`key` 的作用
- [ ] 并发特性：`Suspense` / `useTransition` / `useDeferredValue`
- [ ] 性能优化：`memo` / `useMemo` / 代码分割
- [ ] 练手：写一个迷你 `useState` / `render` demo

## 8. 实战项目（最重要）

- [ ] 入门：个人博客 / 增强版 Todo
- [ ] 进阶：后台管理系统（路由守卫 + 状态管理 + 表格/表单/权限）
- [ ] 综合：电商（购物车、登录、支付沙箱）
- [ ] 部署：Vercel / Netlify / GitHub Pages
- [ ] 关键：代码放 GitHub，写进简历

## 资源与节奏

- 官方文档 `react.dev/learn`（最权威，已重写）
- 书《React 设计原理》《深入浅出 React》
- 教程：React 官方 Beta 文档、Scrimba React 课程
- 节奏：每天 1~2 小时，0~1 约 1 周，2~3 约 2~3 周，4~5 约 2 周，6~7 穿插，8 长期做。阶段 3 起全程用 Hooks。

> 你已有 Vue 经验，迁移会很快——重点对比：**模板 vs JSX、组合式函数 vs Hooks、Pinia vs Zustand/Redux**，思路相通，只是写法不同。
