---
title: 练习 5 · 组合式函数 useFetch 抽离数据逻辑
category: frontend
module: vue
subcat: cases
level: intermediate
readMinutes: 9
tags: "composable, 组合式函数, useFetch, 练习"
summary: 把「请求数据 + loading + error」的重复逻辑抽成组合式函数 useFetch，在多个视图里复用，体会 Vue 3 组合式思维的精髓。
order: 6
---

目标：消除每个视图里重复的 `ref + onMounted + try/catch`，用一个 `useFetch` 搞定。

## 1. 抽组合式函数

`src/composables/useFetch.ts`：

```ts
import { ref, isRef, unref, type Ref } from 'vue'
import request from '@/utils/request'

export function useFetch<T>(url: string | Ref<string>) {
  const data = ref<T | null>(null)
  const error = ref<string | null>(null)
  const loading = ref(false)

  async function execute() {
    loading.value = true
    error.value = null
    try {
      data.value = await request.get(unref(url))
    } catch (e) {
      error.value = (e as Error).message
    } finally {
      loading.value = false
    }
  }

  return { data, error, loading, execute }
}
```

## 2. 在视图里复用

`src/views/About.vue`：

```vue
<script setup lang="ts">
import { useFetch } from '@/composables/useFetch'

// 直接拿到 data / loading / error，无需重复样板
const { data: users, loading, error, execute } = useFetch('/users?_limit=5')
execute()
</script>

<template>
  <p v-if="loading">加载中…</p>
  <p v-else-if="error" class="text-red-500">{{ error }}</p>
  <ul v-else>
    <li v-for="u in users" :key="u.id">{{ u.name }}</li>
  </ul>
</template>
```

## 3. 带参数的变体

`useFetch` 的 `url` 支持传入 `Ref`，配合搜索框自动刷新：

```ts
const keyword = ref('')
const { data, execute } = useFetch(
  computed(() => `/users?q=${keyword.value}`)
)
watch(keyword, execute)
```

## 为什么这么做

- **逻辑复用**：10 个页面要拉数据，以前复制 10 份，现在 1 个函数。
- **关注点分离**：视图只关心「渲染什么」，数据逻辑在 composable 里。
- **可测试**：`useFetch` 脱离组件单测更容易。

> 练习要点：组合式函数以 `use` 开头、返回响应式 `ref`、内部用 `unref` 兼容「字符串 / Ref」两种入参——这是 Vue 生态的常见约定。
