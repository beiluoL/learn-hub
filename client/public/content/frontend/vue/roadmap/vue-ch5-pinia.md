---
title: 第 5 章 · Pinia 状态管理
category: frontend
module: vue
subcat: roadmap
level: intermediate
readMinutes: 15
tags: "Vue, Pinia, 状态管理"
summary: 用 Pinia 管理跨组件全局状态，掌握 state/getters/actions、storeToRefs、异步 action 与数据持久化。
order: 7
prereq: frontend/vue/roadmap/vue-ch4-router
---

当多个不相邻的组件都要用同一份数据（如登录用户、购物车），一层层 `props` 传递会很痛苦。**Pinia** 是 Vue 官方推荐的状态管理库，相当于一个全局「数据仓库」。

## 核心知识点

**Store 三要素**：
- `state`：响应式数据（类似组件的 `data`）。
- `getters`：派生计算值（类似 `computed`）。
- `actions`：修改 state 的方法，可写异步（如调接口）。

**在组件中使用**：`import { useXxxStore }` 后直接访问；要保住响应性，解构用 `storeToRefs(store)` 而不是普通解构。

**异步 action**：在 action 里 `await` 请求，拿到结果再赋给 `state`，组件里只需 `await store.load()`。

**多 store 拆分**：按业务拆成 `useUserStore`、`useCartStore` 等，互不耦合。

**持久化**：用 `pinia-plugin-persistedstate` 把指定 store 自动存到 `localStorage`，刷新不丢。

## 代码示例

### 1）定义一个计数器 store

```javascript
// stores/counter.js
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useCounterStore = defineStore('counter', () => {
  const count = ref(0)
  const double = computed(() => count.value * 2)
  function increment() { count.value++ }
  return { count, double, increment }
})
```

### 2）组件里使用（保持响应性）

```html
<script setup>
import { storeToRefs } from 'pinia'
import { useCounterStore } from '../stores/counter'
const store = useCounterStore()
const { count, double } = storeToRefs(store) // 解构仍响应式
</script>

<template>
  <p>{{ count }} / {{ double }}</p>
  <button @click="store.increment()">+1</button>
</template>
```

### 3）异步 action + 持久化

```javascript
// stores/cart.js
import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useCartStore = defineStore('cart', () => {
  const items = ref([])
  async function load() {
    const res = await fetch('/api/cart')
    items.value = await res.json()
  }
  function add(product) { items.value.push(product) }
  return { items, load, add }
}, { persist: true }) // 开启持久化
```

## 实战小项目：购物车

目标：一个购物车 store，支持加入商品、删除、数量加减，并用 `getters` 算总价，最后持久化到本地。

拆解：
- `useCartStore`：`items` 数组，每项 `{ id, name, price, qty }`。
- `add(item)` 已存在则 `qty++`，否则 `push`。
- `totalPrice` getter：`items.reduce((s, i) => s + i.price * i.qty, 0)`。
- 开启 `persist: true`，刷新页面购物车仍在。
- 在「商品页」和「购物车页」两个不相关组件里共用同一个 store，体会「全局状态」的便利。

## 小结

- Pinia 比 Vuex 更轻、对 TS 更友好，新项目直接选它。
- 记住口诀：**取数据用 storeToRefs，改数据调 action**。
- 下一章进入**生态与工程化**（Vite/TS/axios/UI 库/测试）。
