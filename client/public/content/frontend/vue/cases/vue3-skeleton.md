---
title: Vue3 最小练手骨架（Vite + Pinia + Router + TS）
category: frontend
module: vue
subcat: cases
level: beginner
readMinutes: 8
tags: "Vue3, Vite, Pinia, Router, 练手骨架"
summary: 一个真能跑的 Vue3 最小练手骨架，集成 Vite + Pinia + Vue Router + TypeScript，开箱即跑，作为后续练习章节的底座。
order: 1
---

这是一个**开箱即跑**的 Vue 3 最小骨架，已经把核心生态串起来，后续所有练习章节都基于它扩展。

## 技术栈

- **Vite 6** 极速构建
- **Vue 3.5** 组合式 API + `<script setup>`
- **Pinia 2** 状态管理
- **Vue Router 4** 路由
- **TypeScript** 全量类型

## 目录结构

```
vue-practice/
├── index.html
├── package.json
├── vite.config.ts        # 路径别名 @ → src/
├── tsconfig.json
└── src/
    ├── main.ts           # 挂载 app，注册 Pinia + Router
    ├── App.vue           # 导航 + <RouterView>
    ├── router/index.ts   # 路由表（/ 与 /about）
    ├── stores/counter.ts # 组合式 store 示例
    └── views/
        ├── Home.vue      # 演示 Pinia 计数器
        └── About.vue
```

## 怎么跑起来

```bash
cd vue-practice
npm install
npm run dev      # 打开 http://localhost:5173
```

构建校验：

```bash
npm run build    # vue-tsc 类型检查 + vite 打包
```

## 关键代码速览

`stores/counter.ts`（组合式 store）：

```ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useCounterStore = defineStore('counter', () => {
  const count = ref(0)
  const double = computed(() => count.value * 2)
  function increment() { count.value++ }
  function reset() { count.value = 0 }
  return { count, double, increment, reset }
})
```

`router/index.ts`：

```ts
import { createRouter, createWebHistory } from 'vue-router'
import Home from '@/views/Home.vue'

export default createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: Home },
    { path: '/about', component: () => import('@/views/About.vue') },
  ],
})
```

## 接下来练什么

骨架就绪后，建议按下面的**练习章节**依次扩展，每章都会在骨架基础上加一块能力：

1. 登录守卫 + 用户 Store（Pinia 异步 action + 路由拦截）
2. 接入 Element Plus 组件库，统一 UI
3. 用 axios 封装请求并调用真实接口
4. 组件通信实战（props / emits / slots / provide-inject）
5. 组合式函数 `useFetch` 抽离数据逻辑

> 下方「项目案例」分区里的练习章节，都是基于这个骨架的增量改动，跟着敲一遍即可。
