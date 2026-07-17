# Vue 3 学习打卡清单

> 用法：每完成一项就把 `- [ ]` 改成 `- [x]`。建议按阶段顺序推进，每个阶段都跟着敲代码，别只看视频。

## 阶段 0 · 前置基础（必须扎实）
- [ ] 掌握 HTML 语义化标签与表单（`form` / `input` / `label`）
- [ ] 掌握 CSS：盒模型、flex、grid、定位、响应式、`@media`、CSS 变量
- [ ] 掌握 JS ES6+：解构、箭头函数、模板字符串、`Promise` / `async` / `await`、模块化 `import/export`、`this`、原型链基础
- [ ] 会用终端：切换目录、npm / pnpm 装包、Git 基本操作（add/commit/push）
- [ ] 练手：纯 HTML/CSS/JS 写一个 Todo 或轮播图

## 阶段 1 · Vue 核心基础
- [ ] 理解 MVVM 思想，知道为什么用框架
- [ ] 用 CDN 引入跑通一个 Hello World（先感受）
- [ ] 用 Vite + `create-vue` 初始化一个工程
- [ ] 掌握模板语法 `{{ }}` 与指令 `v-bind(:)` / `v-on(@)` / `v-if` / `v-show` / `v-for` / `v-model`
- [ ] 理解响应式：`data()`（选项式）与 `ref` / `reactive`（组合式）
- [ ] 掌握 `computed` 计算属性与 `watch` / `watchEffect` 侦听
- [ ] 了解生命周期钩子（created / mounted / updated / unmounted）
- [ ] 练手：用 Vue 改写阶段 0 的 Todo，加 `computed` 过滤

## 阶段 2 · 组件化开发
- [ ] 掌握组件注册（局部 / 全局）
- [ ] 父传子：`props`（类型校验、默认值）
- [ ] 子传父：自定义事件 `$emit`
- [ ] 在组件上使用 `v-model` 做双向绑定
- [ ] 插槽 slot：默认 / 具名 / 作用域插槽
- [ ] 理解通信方式对比：`props/$emit`、`provide/inject`（事件总线已弃用）
- [ ] 动态组件 `<component :is>`、异步组件 `defineAsyncComponent`
- [ ] 练手：拆出一个可复用列表项组件 + 分页组件

## 阶段 3 · Composition API（Vue 3 重点，推荐主用）
- [ ] 掌握 `<script setup>` 语法糖（最简洁常用）
- [ ] 搞清 `ref` vs `reactive` 怎么选、`.value` 规则、`toRefs` / `toRef`
- [ ] 组合式下写 `computed` / `watch` / `watchEffect`、`onMounted` 等生命周期
- [ ] 掌握 `provide` / `inject`
- [ ] 学会组合式函数 composables（`useXxx` 抽公共逻辑）
- [ ] 练手：用 `<script setup>` 重写阶段 2 组件，抽一个 `useFetch`

## 阶段 4 · Vue Router 路由
- [ ] `createRouter` 路由表配置、`<router-view>` / `<router-link>`
- [ ] 动态路由 `/user/:id`、查询参数读取
- [ ] 嵌套路由（布局 + 子页面）
- [ ] 编程式导航 `router.push`
- [ ] 路由守卫（全局 / 路由级 / 组件内）做登录鉴权
- [ ] 路由懒加载 `() => import()` 做代码分割
- [ ] 练手：做一个多页小站（首页/列表/详情/关于）+ 登录守卫

## 阶段 5 · Pinia 状态管理（Vuex 已不推荐新项目）
- [ ] 理解为什么需要状态管理
- [ ] 定义 Store：`state` / `getters` / `actions`
- [ ] 组件中读取与修改，用 `storeToRefs` 保持响应性
- [ ] `actions` 里写异步（调接口）
- [ ] 多 store 拆分（按业务模块）
- [ ] 持久化：`pinia-plugin-persistedstate` 存 localStorage
- [ ] 练手：把用户信息、购物车抽到 Pinia

## 阶段 6 · 生态与工程化
- [ ] Vite 配置：别名 `@`、代理跨域、环境变量 `.env`
- [ ] TypeScript 接入（`<script setup lang="ts">`、类型定义）
- [ ] 网络请求：axios 封装拦截器 / 原生 fetch
- [ ] 选 1-2 个 UI 库：Element Plus / Naive UI / Ant Design Vue / Vuetify
- [ ] 表单验证：VeeValidate 或组件库自带
- [ ] 测试：Vitest + `@vue/test-utils`；E2E 用 Playwright / Cypress
- [ ] 练手：用 Element Plus + TS 搭一个后台骨架

## 阶段 7 · 进阶原理
- [ ] 响应式原理：`Object.defineProperty`(Vue2) → `Proxy`(Vue3)，依赖收集 / 派发更新
- [ ] 虚拟 DOM 与 diff 算法
- [ ] 编译时优化：静态提升、PatchFlag
- [ ] 性能优化：`v-once`、`shallowRef`、`keep-alive`、懒加载
- [ ] Tree Shaking 与按需引入
- [ ] 了解 Nuxt 3（SSR / SSG）、组件库开发
- [ ] 练手：写一个迷你响应式（Proxy）demo

## 阶段 8 · 实战项目（最重要，巩固一切）
- [ ] 入门：个人博客 / 增强版 Todo
- [ ] 进阶：后台管理系统（路由守卫 + Pinia + 表格 / 表单 / 权限）
- [ ] 综合：电商（购物车、登录、支付对接沙箱）
- [ ] 部署：Vercel / Netlify / GitHub Pages / 自己的服务器
- [ ] 把代码放 GitHub，写进简历

## 推荐资源
- 官方文档（首选）：https://vuejs.org/guide/ （中文：https://cn.vuejs.org/guide/）
- 书：《Vue.js 设计与实现》（霍春阳，深入原理）
- 教程：Vue Mastery、Vue School
- 社区：掘金 / V2EX 搜 Vue3 实战文章

## 节奏建议
- 每天 1-2 小时：0-1 约 1-2 周，2-3 约 2-3 周，4-5 约 2 周，6-7 穿插，8 长期做。
- 阶段 3 起全程用 `<script setup>`。
