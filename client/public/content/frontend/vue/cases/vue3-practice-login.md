---
title: 练习 1 · 登录守卫 + 用户 Store
category: frontend
module: vue
subcat: cases
level: intermediate
readMinutes: 10
tags: "Pinia, 路由守卫, 登录鉴权, 练习"
summary: 在骨架基础上新增用户 Store（含异步登录），并用路由前置守卫实现登录拦截，掌握 Pinia 异步 action 与导航守卫的配合。
order: 2
---

目标：让用户「未登录不能进 /about」，登录后可见，并能在页面上看到当前用户。

## 1. 新增用户 Store

`src/stores/user.ts`：

```ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useUserStore = defineStore('user', () => {
  const token = ref(localStorage.getItem('token') || '')
  const name = ref(localStorage.getItem('name') || '')

  const isLogin = computed(() => !!token.value)

  // 异步登录：真实项目里换成 axios 请求
  async function login(user: string, pwd: string) {
    if (!user || !pwd) throw new Error('账号或密码为空')
    // 模拟接口延迟
    await new Promise((r) => setTimeout(r, 400))
    token.value = 'mock-token-' + Date.now()
    name.value = user
    localStorage.setItem('token', token.value)
    localStorage.setItem('name', name.value)
  }

  function logout() {
    token.value = ''
    name.value = ''
    localStorage.removeItem('token')
    localStorage.removeItem('name')
  }

  return { token, name, isLogin, login, logout }
})
```

## 2. 加一个受保护路由 + 登录页

`router/index.ts` 增加 `/login` 与受保护的 `/about`：

```ts
import { createRouter, createWebHistory } from 'vue-router'
import Home from '@/views/Home.vue'
import Login from '@/views/Login.vue'
import About from '@/views/About.vue'
import { useUserStore } from '@/stores/user'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: Home },
    { path: '/login', component: Login },
    { path: '/about', component: About, meta: { requiresAuth: true } },
  ],
})

// 前置守卫：需要登录却没登录 → 跳登录页
router.beforeEach((to) => {
  const user = useUserStore()
  if (to.meta.requiresAuth && !user.isLogin) {
    return { path: '/login', query: { redirect: to.fullPath } }
  }
})

export default router
```

`src/views/Login.vue`（关键片段）：

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'

const route = useRoute()
const router = useRouter()
const user = useUserStore()
const username = ref('')
const password = ref('')

async function onSubmit() {
  await user.login(username.value, password.value)
  router.push((route.query.redirect as string) || '/')
}
</script>
```

## 3. 验证

- 未登录直接访问 `/about` → 自动跳 `/login`
- 登录成功后回到目标页，`Home.vue` 里 `user.isLogin` 变为 `true`
- 刷新页面后（localStorage 持久化）仍保持登录态

> 关键认知：**守卫里用 `useUserStore()` 拿的是同一个实例**，Pinia 默认全局单例，所以导航守卫和组件共享状态。
