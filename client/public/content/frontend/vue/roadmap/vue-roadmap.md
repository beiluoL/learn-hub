---
title: Vue 3 系统学习路线（含打卡清单）
category: frontend
module: vue
subcat: roadmap
timeline: true
level: beginner
readMinutes: 18
tags: "Vue, 学习路线, 路线图, 打卡"
summary: 从前置基础到实战项目的 9 阶段 Vue 3 学习路线，每阶段给出目标、产出、重点与可勾选任务，并附 React 对照与学习误区。
order: 1
---

这份路线把 Vue 3 学习拆成 **9 个阶段**，每个阶段都给出**目标 / 产出 / 重点**和**可勾选任务**。建议每完成一项就勾掉一项（`- [x]`），保持「边看边敲」的节奏——**只读不写，一周就忘**。

## 怎么用这份路线

- **顺序学习**：阶段之间有依赖（卡片上的 `prereq` 串成链路），建议从 0 开始。
- **重练轻看**：每章末尾都有「实战小项目」，务必亲手敲完、跑起来，再对照本章知识点检查。
- **对照 React**：你已有 React 经验，每章我会点出「Vue 里等价于 React 的什么」，迁移会非常快。
- **打卡**：下方清单用于自我督促，勾选只是心理反馈，真正掌握的标志是「能独立把实战项目写出来」。

## 阶段 → 章节 映射

| 阶段 | 章节 | 主题 | 难度 |
| --- | --- | --- | --- |
| 0 | 第 0 章 | 前置基础与环境搭建 | 入门 |
| 1 | 第 1 章 | Vue 核心基础（模板/指令/响应式） | 入门 |
| 2 | 第 2 章 | 组件化开发（props/emit/slot） | 进阶 |
| 3 | 第 3 章 | Composition API（`<script setup>`） | 进阶 |
| 4 | 第 4 章 | Vue Router 路由 | 进阶 |
| 5 | 第 5 章 | Pinia 状态管理 | 进阶 |
| 6 | 第 6 章 | 生态与工程化（Vite/TS/UI/测试） | 高级 |
| 7 | 第 7 章 | 进阶原理与性能优化 | 高级 |
| 8 | 实战 | 项目 + 部署（见 cases 与路线图末尾） | 综合 |

## 0. 前置基础（必须扎实）

**目标**：环境能跑、看懂 Vue 单文件组件（SFC）三块结构、理解「响应式 = 数据驱动视图」。
**产出**：用 Vite 跑起第一个 Vue 项目；用原生 JS 与 Vue 各写一个计数器并对比。

- [ ] HTML 语义化标签与表单：`form` / `input` / `label` / `select` / `section` / `article`
- [ ] CSS 盒模型、flex、grid、响应式与 CSS 变量（`--x`）
- [ ] JavaScript(ES6+)：解构、箭头函数、Promise/async、模块化 `import/export`、`this`、数组方法
- [ ] 终端基本操作、`npm/pnpm` 装包、`Git` 提交与分支
- [ ] 用 Vite 创建 Vue 项目；理解 SFC 的 `<template>/<script setup>/<style scoped>`
- [ ] **练手**：纯 HTML/CSS/JS 写一个 Todo 或轮播图；再用 Vue 改写并体会响应式

## 1. Vue 核心基础

**目标**：掌握模板怎么写、数据怎么变、视图怎么跟着变。
**产出**：可过滤的待办清单（computed 实时统计、v-model 收集输入）。

- [ ] 理解 MVVM 思想；先用 CDN 感受响应式，再用 Vite 工程化
- [ ] 模板语法：`{{}}` 插值（仅限表达式）、`v-html` 慎用
- [ ] 指令 `v-bind(:)` / `v-on(@)` / `v-if` / `v-show` / `v-for` / `v-model` 及常用修饰符
- [ ] 响应式数据：`ref` / `reactive`，理解 `.value` 规则
- [ ] `computed` 计算属性、`watch` / `watchEffect` 侦听、事件修饰符（`.stop`/`.prevent`/`.once`）
- [ ] 生命周期钩子：`onMounted` / `onUpdated` / `onUnmounted`
- [ ] **练手**：用 Vue 改写阶段 0 的 Todo，加计算属性过滤与「只看未完成」

## 2. 组件化开发

**目标**：把 UI 拆成独立、可复用、可组合的小块，理清组件间数据流向。
**产出**：可复用列表组件 + 分页组件（含作用域插槽）。

- [ ] 组件注册（`<script setup>` 直接 import 即用）、单文件组件拆分原则
- [ ] props 父传子（类型校验 / 默认值 / 校验函数 / 单向数据流）
- [ ] 自定义事件 `$emit` 子传父；`v-model` 在组件上的双向绑定
- [ ] 插槽 slot：默认 / 具名 / 作用域插槽（含插槽 props）
- [ ] 跨层通信：`provide` / `inject`
- [ ] 动态组件 `<component :is>`、异步组件 `defineAsyncComponent`
- [ ] **练手**：拆出可复用列表项组件 + 分页组件

## 3. Composition API（Vue 3 重点）

**目标**：用 `<script setup>` 把「同一功能的代码」聚在一起，并能抽成组合式函数复用。
**产出**：用 `useFetch` / `useCounter` 重构成文章列表。

- [ ] `<script setup>` 语法糖与编译期宏（`defineProps` / `defineEmits` / `defineExpose`）
- [ ] `ref` vs `reactive` 取舍、`.value` 规则、`toRefs` / `toRef` / `toRaw` / `markRaw`
- [ ] `computed` 的 getter/setter；`watch` / `watchEffect` 选项（flush、immediate、deep）
- [ ] 组合式函数 `useXxx`：把通用逻辑当「积木」，对比 `mixin` 的优势
- [ ] **练手**：用 `<script setup>` 重写阶段 2 组件，抽一个 `useFetch`

## 4. Vue Router 路由

**目标**：用前端路由搭建多页应用，理解「URL 即状态，守卫即权限」。
**产出**：多页小站（首页/列表/详情/关于）+ 登录守卫。

- [ ] `createRouter` 路由表、`<router-view>` / `<router-link>`
- [ ] 动态路由 `/user/:id`、嵌套路由、命名视图
- [ ] 编程式导航 `router.push` / `replace`；参数响应性（需 `watch` route）
- [ ] 路由守卫（全局/路由级/组件内）做登录鉴权
- [ ] 路由懒加载 `() => import()`；`history` 模式 vs `hash` 模式（**静态托管/GitHub Pages 用 hash 更稳**）
- [ ] **练手**：多页小站 + 登录守卫

## 5. Pinia 状态管理

**目标**：用全局「数据仓库」管理跨组件状态（用户、购物车）。
**产出**：购物车 store（增删改、getter 算总价、持久化）。

- [ ] Store 三要素：`state` / `getters` / `actions`；setup 写法与 options 写法
- [ ] `storeToRefs` 保持响应性；`$patch` / `$subscribe` / `$reset`
- [ ] actions 写异步（调接口）、跨 store 调用、`$onAction` 监听
- [ ] 持久化 `pinia-plugin-persistedstate`（含 storage 选项）
- [ ] **练手**：把用户信息、购物车抽到 Pinia

## 6. 生态与工程化

**目标**：从「能跑」到「能上线、能协作」。
**产出**：Element Plus + TS 后台骨架（菜单/表格/弹窗表单）。

- [ ] Vite 配置（别名 `@`、代理跨域、`import.meta.env`、`.env` 文件）
- [ ] TypeScript 接入（`<script setup lang="ts">`、`defineProps<...>()`、`withDefaults`）
- [ ] 网络请求 axios 封装（拦截器、超时、错误统一处理）
- [ ] UI 库选型 1~2 个：Element Plus、Naive UI、Ant Design Vue、Vuetify
- [ ] 测试：Vitest + @vue/test-utils；Lint/Format（ESLint + Prettier）
- [ ] **练手**：Element Plus + TS 搭后台骨架

## 7. 进阶原理与性能优化

**目标**：懂原理才能写出更优代码，知道「为什么快 / 为什么慢」。
**产出**：迷你响应式 demo + `keep-alive` 多标签后台。

- [ ] 响应式原理：`Proxy` 依赖收集 / 派发更新（对比 Vue 2 `defineProperty`）
- [ ] 虚拟 DOM 与 diff、编译时优化（静态提升、PatchFlag、Block Tree）
- [ ] 性能优化：`v-once`、`v-memo`、`shallowRef`、`keep-alive`、懒加载、虚拟列表
- [ ] `nextTick` 与异步更新队列；了解 Nuxt 3（SSR）、组件库开发
- [ ] **练手**：写一个迷你响应式 demo；用 `keep-alive` 缓存标签页

## 8. 实战项目（最重要）

**目标**：把前面所学串成**能写进简历的作品**。
**产出**：至少 1 个完整部署上线的项目。

- [ ] 入门：个人博客 / 增强版 Todo（含路由 + Pinia）
- [ ] 进阶：后台管理系统（路由守卫 + Pinia + 表格/表单/权限）
- [ ] 综合：电商（购物车、登录、支付沙箱）
- [ ] 部署：Vercel / Netlify / GitHub Pages（注意 `base` 与 hash 路由）
- [ ] **关键**：代码放 GitHub，写进简历；用 `cases/` 里的实战篇当作模板

## Vue 与 React 对照（你有 React 经验，重点看这里）

| 概念 | React | Vue 3 |
| --- | --- | --- |
| 视图描述 | JSX（JavaScript 里写标签） | 模板 `{{ }}` + 指令（HTML 里写） |
| 状态 | `useState` / `useReducer` | `ref` / `reactive` |
| 副作用 | `useEffect` | `watch` / `watchEffect` / `onMounted` |
| 复用逻辑 | 自定义 Hook | 组合式函数 `useXxx` |
| 全局状态 | Redux / Zustand / Context | Pinia / `provide-inject` |
| 路由 | React Router | Vue Router |
| 构建 | Vite / CRA | Vite（官方推荐） |

> 思路是相通的：**数据驱动视图 + 单向数据流 + 组件化**。差异主要在「语法形态」和「心智模型」（Vue 帮你做了更多响应式自动追踪）。

## 学习方法与常见误区

- **误区 1：先囤课再学**。课程看三遍不如亲手敲一遍。每章实战必须自己写出来。
- **误区 2：死记 API**。理解「为什么响应式」比背 `ref`/`reactive` 签名重要；原理章（第 7 章）建议反复看。
- **误区 3：跳过 TypeScript**。现代 Vue 项目几乎都用 TS，第 6 章尽早接入，别等项目中途补。
- **误区 4：只在本地跑**。阶段 8 一定要部署上线，部署能暴露很多本地遇不到的问题（base 路径、路由模式、环境变量）。
- **节奏建议**：每天 1~2 小时。0~1 约 1~2 周，2~3 约 2~3 周，4~5 约 2 周，6~7 穿插，8 长期做。阶段 3 起全程用 `<script setup>`。

## 资源

- 官方文档 `vuejs.org/guide`（最权威，建议通读）
- 路由 `router.vuejs.org`、状态 `pinia.vuejs.org`、构建 `vitejs.dev`
- 书《Vue.js 设计与实现》（霍春阳，讲原理，配合第 7 章）
- 教程：Vue Mastery / Vue School
- 本项目 `cases/` 下的 Vue 实战篇（API 封装、登录、组合式函数、UI 骨架、通信）可直接当模板
