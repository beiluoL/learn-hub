---
title: 第 4 章 · Vue Router 路由
category: frontend
module: vue
subcat: roadmap
level: intermediate
readMinutes: 16
tags: "Vue, Router, 路由, 守卫"
summary: 用 Vue Router 搭建多页应用，掌握动态路由、嵌套路由、编程式导航、路由守卫与懒加载。
order: 6
prereq: frontend/vue/roadmap/vue-ch3-composition
---

单页应用（SPA）里「页面」其实是组件，靠 **Vue Router** 在不同 URL 下切换不同组件，无需整页刷新。

## 核心知识点

**路由表**：用 `createRouter` 把 URL 路径映射到组件，配在 `routes` 数组里。

**出口与链接**：`<router-view>` 是路由组件的显示位置；`<router-link to="/">` 生成导航链接（比 `<a>` 好，不会整页刷新）。

**动态路由**：`/user/:id` 中的 `:id` 是参数，组件内用 `useRoute().params.id` 读取，适合「详情页」。

**嵌套路由**：路由里写 `children`，子组件渲染在父级的 `<router-view>` 中，适合「布局 + 子页面」。

**编程式导航**：用 `router.push('/path')` 在事件里跳转，常配合表单提交后跳结果页。

**路由守卫**：`router.beforeEach` 在跳转前拦截，用来做登录校验——没登录就 `next('/login')`。

**路由懒加载**：`component: () => import('./Page.vue')` 让每个页面单独打包，首屏更快。

## 代码示例

### 1）定义路由表

```javascript
// router/index.js
import { createRouter, createWebHistory } from 'vue-router'
import Home from '../views/Home.vue'

const routes = [
  { path: '/', component: Home },
  { path: '/user/:id', component: () => import('../views/User.vue') }, // 懒加载
]
export default createRouter({ history: createWebHistory(), routes })
```

### 2）读取动态路由参数

```html
<!-- User.vue -->
<script setup>
import { useRoute } from 'vue-router'
const route = useRoute()
console.log(route.params.id) // 来自 /user/123
</script>
```

### 3）登录守卫

```javascript
router.beforeEach((to) => {
  const isLogin = localStorage.getItem('token')
  if (to.meta.requiresAuth && !isLogin) {
    return '/login' // 拦截到登录页
  }
})
```

在路由上标记需要鉴权：

```javascript
{ path: '/admin', component: Admin, meta: { requiresAuth: true } }
```

## 实战小项目：多页小站 + 登录守卫

做一个包含「首页 / 文章列表 / 文章详情 / 关于」的小站，并加一层保护：

- `列表 → 详情` 用动态路由 `/article/:id`，详情页根据 `id` 展示不同内容。
- 点「进入后台」跳 `/admin`，`beforeEach` 检测到未登录就弹回 `/login`。
- 登录页用一个假按钮「模拟登录」写入 `localStorage.token`，再 `router.push('/admin')`。

做完你就理解了前端路由的核心：**URL 即状态，守卫即权限**。

## 小结

- `<router-view>` 是出口，`<router-link>` 是导航，二者成对出现。
- 动态参数用 `useRoute().params`，跳转用 `router.push`。
- 下一章用 **Pinia** 管理跨页面的全局状态（如用户信息、购物车）。
