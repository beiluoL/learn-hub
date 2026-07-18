---
title: 第 5 章 · Pinia 状态管理
category: frontend
module: vue
subcat: roadmap
level: intermediate
readMinutes: 24
tags: "Vue, Pinia, 状态管理"
summary: 用 Pinia 管理跨组件全局状态，掌握 state/getters/actions、storeToRefs、异步 action、跨 store 调用与数据持久化。
order: 7
prereq: frontend/vue/roadmap/vue-ch4-router
---

当多个**不相邻**的组件都要用同一份数据（如登录用户、购物车），一层层 `props` 传递会很痛苦。**Pinia** 是 Vue 官方推荐的状态管理库，相当于一个全局「数据仓库」。相比旧版 Vuex，它更轻、对 TS 更友好、写法更接近 Composition API。

## 核心知识点

### 1. 两种定义方式
- **Setup 写法**（推荐，和第 3 章组合式一致）：用 `ref`/`computed` 定义 state 与 getter，用函数定义 action。
- **Options 写法**：`state` / `getters` / `actions` 分块写，适合从 Vuex 迁移或习惯选项式的人。

```javascript
// stores/counter.js（setup 写法）
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useCounterStore = defineStore('counter', () => {
  const count = ref(0)
  const double = computed(() => count.value * 2)
  function increment() { count.value++ }
  return { count, double, increment }
})
```

### 2. state 的修改与订阅
- 直接 `store.count++`（setup 写法）或 `store.$patch({ count: 1 })`（批量、性能好）。
- `store.$reset()`：重置回初始值（options 写法有效；setup 写法需手动实现）。
- `store.$subscribe((mutation, state) => {...})`：监听 state 变化（可用于埋点、持久化兜底）。
- `store.$patch()` 比逐字段赋值更高效，且能传入函数做条件更新。

### 3. getters（派生计算）
- 类似 `computed`，可访问其他 getter（用 `this`）。
- **带参数的 getter**：返回一个函数即可（如按 id 查项目）——注意这种「返回函数」的 getter 不会被缓存。

```javascript
export const useCartStore = defineStore('cart', {
  state: () => ({ items: [] }),
  getters: {
    total: (state) => state.items.reduce((s, i) => s + i.price * i.qty, 0),
    findById: (state) => (id) => state.items.find((i) => i.id === id),
  },
})
```

### 4. actions（改数据 / 异步）
- 在 action 里 `await` 请求，拿到结果再赋给 state；组件里只需 `await store.load()`。
- `store.$onAction(({ name, after, onError }) => {...})`：监听所有 action（全局拦截、日志、错误处理）。
- 跨 store 调用：在一个 store 的 action 里直接 `useOtherStore()` 即可。

```javascript
// stores/cart.js
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useUserStore } from './user'

export const useCartStore = defineStore('cart', () => {
  const items = ref([])
  async function load() {
    const user = useUserStore()
    const res = await fetch(`/api/cart?uid=${user.id}`)
    items.value = await res.json()
  }
  function add(product) {
    const exist = items.value.find((i) => i.id === product.id)
    exist ? exist.qty++ : items.value.push({ ...product, qty: 1 })
  }
  return { items, load, add }
})
```

### 5. 在组件中使用（保持响应性）
- 直接 `const store = useCartStore()`，模板里 `store.xxx` 自动响应式。
- **解构要用 `storeToRefs(store)`**，普通解构会丢失响应性（和第 3 章 `toRefs` 同理）。

```html
<script setup>
import { storeToRefs } from 'pinia'
import { useCartStore } from '../stores/cart'
const store = useCartStore()
const { items, total } = storeToRefs(store) // 解构仍响应式
// 改数据：直接调 action
store.add({ id: 1, name: '书', price: 39, qty: 1 })
</script>
```

### 6. 持久化
用 `pinia-plugin-persistedstate`，把指定 store 自动存到 `localStorage` / `sessionStorage`，刷新不丢。

```javascript
// stores/cart.js（setup 写法开启）
export const useCartStore = defineStore('cart', () => { /* ... */ },
  { persist: true }) // 整个 store 持久化

// 进阶：只持久化部分字段、换存储
{
  persist: {
    pick: ['items'],                  // 只存 items
    storage: sessionStorage,          // 换存储
  }
}
```

```javascript
// main.js 注册插件
import { createPinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
const pinia = createPinia()
pinia.use(piniaPluginPersistedstate)
```

## 代码示例汇总
见上方各小节。记住口诀：**取数据用 `storeToRefs`，改数据调 action**。

## 实战小项目：购物车

目标：一个购物车 store，支持加入商品、删除、数量加减，并用 getter 算总价，最后持久化到本地。

拆解：
- `useCartStore`：`items` 数组，每项 `{ id, name, price, qty }`。
- `add(item)` 已存在则 `qty++`，否则 `push`。
- `remove(id)` / `inc(id)` / `dec(id)`（减到 0 可移除）。
- `totalPrice` getter：`items.reduce((s, i) => s + i.price * i.qty, 0)`。
- 开启 `persist: true`，刷新页面购物车仍在。
- 在「商品页」和「购物车页」两个不相关组件里共用同一个 store，体会「全局状态」的便利。

## 常见坑

- **解构丢响应性**：`const { count } = store` 之后 `count` 不会更新；必须用 `storeToRefs(store)`。
- **直接改 state 数组/对象**：Pinia 允许直接改（比 Vuex 宽松），但批量更新用 `$patch` 性能更好。注意别在 action 外意外改了不该改的。
- **持久化只持久化了部分却以为全存了**：`pick` 配置要写全；默认 `persist: true` 是存整个 store。
- **SSR / 多标签页不同步**：`localStorage` 持久化不会跨标签页实时同步，需要可监听 `storage` 事件或接受刷新才同步。
- **循环依赖 store**：A 引用 B、B 又引用 A 会在初始化时出错；把共享逻辑抽到第三个 store 或 composable。

## 小结

- Pinia 比 Vuex 更轻、对 TS 更友好，新项目直接选它。
- 核心 API：`state` / `getters` / `actions`；组件内 `storeToRefs` 取、`action` 改。
- 学会跨 store 调用与持久化后，就能支撑起「用户 + 购物车 + 设置」这类跨页面全局数据。
- 下一章进入**生态与工程化**（Vite/TS/axios/UI 库/测试），让项目可维护可协作。
