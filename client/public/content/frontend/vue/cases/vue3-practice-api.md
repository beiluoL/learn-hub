---
title: 练习 3 · axios 封装与接口调用
category: frontend
module: vue
subcat: cases
level: intermediate
readMinutes: 10
tags: "axios, 网络请求, 拦截器, 练习"
summary: 封装一个带 baseURL、请求/响应拦截器的 axios 实例，并在用户 Store 的登录 action 里真正发起请求（用 jsonplaceholder 兜底）。
order: 4
---

目标：不再用 `setTimeout` 假登录，而是走真实 HTTP 请求；并统一处理错误与 token 注入。

## 1. 安装与封装

```bash
npm i axios
```

`src/utils/request.ts`：

```ts
import axios from 'axios'

const request = axios.create({
  baseURL: import.meta.env.VITE_API_BASE || 'https://jsonplaceholder.typicode.com',
  timeout: 8000,
})

// 请求拦截：自动带 token
request.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// 响应拦截：统一拆 data / 处理错误
request.interceptors.response.use(
  (res) => res.data,
  (err) => {
    console.error('请求失败', err.message)
    return Promise.reject(err)
  }
)

export default request
```

## 2. 在 Store 里用真实请求

把练习 1 的 `login` 改成真请求（这里用 jsonplaceholder 的登录占位接口思想，实际项目替换为你的后端）：

```ts
import request from '@/utils/request'

async function login(user: string, pwd: string) {
  const res = await request.post('/auth/login', { user, pwd })
  token.value = res.token
  name.value = user
  localStorage.setItem('token', token.value)
}
```

## 3. 拉一个列表验证

`src/views/About.vue` 里请求用户列表：

```vue
<script setup lang="ts">
import { ref, onMounted } from 'vue'
import request from '@/utils/request'

const list = ref<any[]>([])
onMounted(async () => {
  list.value = await request.get('/users?_limit=5')
})
</script>

<template>
  <ul class="max-w-md mx-auto mt-10 space-y-2">
    <li v-for="u in list" :key="u.id" class="p-3 bg-white rounded shadow">
      {{ u.name }} · {{ u.email }}
    </li>
  </ul>
</template>
```

## 4. 环境变量

项目根新建 `.env`：

```
VITE_API_BASE=https://your-api.example.com
```

> 练习要点：**拦截器是统一逻辑的黄金位置**——token 注入、错误提示、loading 计数都放这里。生产里还会在响应拦截里做 401 跳登录。
