---
title: Vue 3 系统学习路线（含打卡清单）
category: frontend
module: vue
subcat: roadmap
timeline: true
level: beginner
readMinutes: 12
tags: "Vue, 学习路线, 路线图, 打卡"
summary: 从前置基础到实战项目的 9 阶段 Vue 3 学习路线，每个阶段拆成可勾选任务，方便对照打卡。
order: 1
---

这份路线把 Vue 3 学习拆成 9 个阶段，每个阶段都给出**具体任务**与**练手目标**。建议每完成一项就勾掉一项（`- [x]`），每周保持 1~2 小时节奏，边看边敲。

## 0. 前置基础（必须扎实）

- [ ] HTML 语义化标签与表单：`form` / `input` / `label` / `select`
- [ ] CSS 盒模型、flex、grid、响应式与 CSS 变量
- [ ] JavaScript(ES6+)：解构、箭头函数、Promise/async、模块化 `import/export`、`this`
- [ ] 终端基本操作、`npm/pnpm` 装包、Git 提交
- [ ] 练手：纯 HTML/CSS/JS 写一个 Todo 或轮播图

## 1. Vue 核心基础

- [ ] 理解 MVVM 思想；先用 CDN 引入感受响应式，再用 Vite 工程化
- [ ] 模板语法：`{{}}`、指令 `v-bind(:)` / `v-on(@)` / `v-if` / `v-show` / `v-for` / `v-model`
- [ ] 响应式数据：`ref` / `reactive`
- [ ] `computed` 计算属性、`watch` / `watchEffect` 侦听、事件修饰符
- [ ] 生命周期钩子：`onMounted` / `onUpdated` / `onUnmounted`
- [ ] 练手：用 Vue 改写阶段 0 的 Todo，加计算属性过滤

## 2. 组件化开发

- [ ] 组件注册、props 父传子（类型校验 / 默认值）
- [ ] 自定义事件 `$emit` 子传父；`v-model` 在组件上双向绑定
- [ ] 插槽 slot：默认 / 具名 / 作用域插槽
- [ ] 通信对比：`props/$emit`、`provide/inject`
- [ ] 动态组件 `<component :is>`、异步组件 `defineAsyncComponent`
- [ ] 练手：拆出可复用列表项组件 + 分页组件

## 3. Composition API（Vue 3 重点）

- [ ] `<script setup>` 语法糖（最简洁常用）
- [ ] `ref` vs `reactive` 怎么选、`.value` 规则、`toRefs/toRef`
- [ ] `computed/watch/watchEffect` 组合式写法
- [ ] `provide/inject`；组合式函数 `useXxx` 抽逻辑
- [ ] 练手：用 `<script setup>` 重写阶段 2 组件，抽一个 `useFetch`

## 4. Vue Router 路由

- [ ] `createRouter` 路由表、`<router-view>` / `<router-link>`
- [ ] 动态路由 `/user/:id`、嵌套路由、编程式导航 `router.push`
- [ ] 路由守卫（登录鉴权）、路由懒加载 `() => import()`
- [ ] 练手：多页小站（首页/列表/详情/关于）+ 登录守卫

## 5. Pinia 状态管理

- [ ] Store：`state / getters / actions`；`storeToRefs` 保持响应性
- [ ] actions 写异步（调接口）；多 store 拆分
- [ ] 持久化 `pinia-plugin-persistedstate`
- [ ] 练手：把用户信息、购物车抽到 Pinia

## 6. 生态与工程化

- [ ] Vite 配置（别名、代理跨域、`.env`）
- [ ] TypeScript 接入（`<script setup lang="ts">`）
- [ ] 网络请求 axios 封装 / fetch；UI 库选 1~2 个：Element Plus、Naive UI
- [ ] 测试：Vitest + @vue/test-utils
- [ ] 练手：Element Plus + TS 搭后台骨架

## 7. 进阶原理

- [ ] 响应式原理：`Proxy`（Vue3）依赖收集 / 派发更新
- [ ] 虚拟 DOM 与 diff、编译时优化（静态提升、PatchFlag）
- [ ] 性能优化：`v-once`、`shallowRef`、`keep-alive`、懒加载
- [ ] 了解 Nuxt 3（SSR）、组件库开发
- [ ] 练手：写一个迷你响应式 demo

## 8. 实战项目（最重要）

- [ ] 入门：个人博客 / 增强版 Todo
- [ ] 进阶：后台管理系统（路由守卫 + Pinia + 表格/表单/权限）
- [ ] 综合：电商（购物车、登录、支付沙箱）
- [ ] 部署：Vercel / Netlify / GitHub Pages
- [ ] 关键：代码放 GitHub，写进简历

## 资源与节奏

- 官方文档 `vuejs.org/guide`（最权威）
- 书《Vue.js 设计与实现》（霍春阳，讲原理）
- 教程：Vue Mastery / Vue School
- 节奏：每天 1~2 小时，0~1 约 1~2 周，2~3 约 2~3 周，4~5 约 2 周，6~7 穿插，8 长期做。阶段 3 起全程用 `<script setup>`。

> 你已有 React 经验，迁移会很快——重点对比：**JSX vs 模板、hooks vs 组合式函数、Redux vs Pinia**，思路相通。
