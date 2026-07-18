---
title: 第 4 章 · Vue Router 路由
category: frontend
module: vue
subcat: roadmap
level: intermediate
readMinutes: 26
tags: "Vue, Router, 路由, 守卫"
summary: 用 Vue Router 搭建多页应用，掌握动态路由、嵌套路由、编程式导航、路由守卫与懒加载，并注意静态部署的 hash 模式。
order: 6
prereq: frontend/vue/roadmap/vue-ch3-composition
---

单页应用（SPA）里「页面」其实是组件，靠 **Vue Router** 在不同 URL 下切换不同组件，无需整页刷新。本章还会特别提醒**部署到 GitHub Pages 这类静态托管时的路由模式选择**——这是很多项目上线后才暴露的坑。

## 核心知识点

### 1. 路由模式（重点！）
- **`createWebHistory`**（HTML5 history）：URL 干净（`/user/1`），但**刷新或直接访问子路由时，静态服务器需把所有路径回退到 index.html**——GitHub Pages 默认不支持，部署会 404。
- **`createWebHashHistory`**（hash）：URL 带 `#`（`/#/user/1`），**不需要服务器配置，刷新不 404**，是静态托管 / GitHub Pages 的稳妥选择。
- 本项目 `beiluol.github.io/learn-hub/` 正是用 hash 模式 + `base: '/learn-hub/'` 才正常工作的。

```javascript
import { createRouter, createWebHashHistory } from 'vue-router'
const router = createRouter({
  history: createWebHashHistory(import.meta.env.BASE_URL), // 适配 base 路径
  routes,
})
```

### 2. 路由表与出口
- `routes` 数组：把路径映射到组件。可加 `name`、`meta`、`redirect`、`alias`。
- `<router-view>`：路由组件的显示位置（可命名视图，多个出口）。
- `<router-link to="/">`：生成导航链接（比 `<a>` 好，不会整页刷新；自动加 `active` 类）。

```javascript
const routes = [
  { path: '/', name: 'home', component: Home },
  { path: '/user/:id', name: 'user', component: () => import('../views/User.vue') },
  { path: '/:pathMatch(.*)*', name: '404', component: NotFound }, // 兜底 404
]
```

### 3. 动态路由与参数
- `/user/:id` 中 `:id` 是参数，组件内用 `useRoute().params.id` 读取。
- **参数响应性**：从 `/user/1` 切到 `/user/2`，组件**不会重建**，但 `route.params` 会变——需要用 `watch(() => route.params.id, ...)` 重新拉数据。

### 4. 嵌套路由
路由里写 `children`，子组件渲染在**父级 `<router-view>`** 中，适合「布局 + 子页面」（如后台的侧边栏 + 内容区）。

```javascript
const routes = [{
  path: '/admin', component: AdminLayout,
  children: [
    { path: '', component: AdminHome },            // /admin
    { path: 'users', component: AdminUsers },      // /admin/users
  ],
}]
```

### 5. 编程式导航
- `router.push('/path')`：跳转（压入历史，可返回）。
- `router.replace('/path')`：替换当前历史（不可返回）。
- 传参：`router.push({ name: 'user', params: { id: 1 } })` 或 `{ path: '/user/1', query: { tab: 'a' } }`。
- `push` 返回 Promise，可 `await` 或 `.catch` 处理「重复导航」等错误。

### 6. 路由守卫（登录鉴权核心）
- **全局**：`router.beforeEach((to, from) => {...})` 跳转前拦截，返回 `false` 取消、`'/login'` 重定向、`undefined` 放行。
- **路由级**：`beforeEnter` 写在单个路由上。
- **组件内**：`beforeRouteEnter` / `beforeRouteUpdate` / `beforeRouteLeave`（常用于离开前确认未保存内容）。
- 完整解析流程：导航触发 → 失活组件 `beforeRouteLeave` → 全局 `beforeEach` → 路由级 `beforeEnter` → 组件 `beforeRouteEnter` → 全局 `beforeResolve` → 导航确认 → `afterEach` → DOM 更新 → `beforeRouteEnter` 回调。

### 7. 懒加载与滚动行为
- `component: () => import('./Page.vue')` 让每个页面单独打包，首屏更快。
- `scrollBehavior` 控制切换页面后的滚动位置（如回到顶部）。

```javascript
const router = createRouter({
  history: createWebHashHistory(),
  routes,
  scrollBehavior: () => ({ top: 0 }),
})
```

## 代码示例

### 1）定义路由表 + 兜底 404

```javascript
// router/index.js
import { createRouter, createWebHashHistory } from 'vue-router'
import Home from '../views/Home.vue'

const routes = [
  { path: '/', name: 'home', component: Home },
  { path: '/article/:id', name: 'article',
    component: () => import('../views/Article.vue') }, // 懒加载
  { path: '/:pathMatch(.*)*', name: '404', component: () => import('../views/NotFound.vue') },
]
export default createRouter({ history: createWebHashHistory(), routes })
```

### 2）读取动态参数（并处理参数变化）

```html
<!-- Article.vue -->
<script setup>
import { useRoute, watch, ref } from 'vue'
import { useFetch } from '../composables/useFetch'
const route = useRoute()
const { data, loading } = useFetch(`/api/article/${route.params.id}`)

// 从 /article/1 切到 /article/2 时重新拉数据
watch(() => route.params.id, (id) => {
  // 重新触发请求（此处简化为刷新页面数据）
  location.reload() // 仅演示；真实项目用 watch 重新调用 fetch
})
</script>
```

### 3）登录守卫（全局）

```javascript
router.beforeEach((to) => {
  const token = localStorage.getItem('token')
  if (to.meta.requiresAuth && !token) {
    return { name: 'login' } // 拦截到登录页，保留原目标可用 to.fullPath
  }
  if (to.name === 'login' && token) {
    return { name: 'home' } // 已登录还去登录页则回首页
  }
})
```

```javascript
// 路由上标记需要鉴权
{ path: '/admin', component: Admin, meta: { requiresAuth: true } }
```

### 4）编程式导航 + 处理重复跳转报错

```html
<script setup>
import { useRouter } from 'vue-router'
const router = useRouter()
const goDetail = (id) => {
  router.push({ name: 'article', params: { id } })
    .catch((err) => { if (err.name !== 'NavigationDuplicated') throw err })
}
</script>
```

## 实战小项目：多页小站 + 登录守卫

做一个包含「首页 / 文章列表 / 文章详情 / 关于」的小站，并加一层保护：

- `列表 → 详情` 用动态路由 `/article/:id`，详情页根据 `id` 展示不同内容（注意参数变化的重新拉取）。
- 点「进入后台」跳 `/admin`，`beforeEach` 检测到未登录就弹回 `/login`。
- 登录页用一个假按钮「模拟登录」写入 `localStorage.token`，再 `router.push(目标 || '/admin')`。
- **部署练习**：用 `createWebHashHistory` 构建并预览，确认刷新 `/#/admin` 不 404（对比 history 模式在静态托管的差异）。

做完你就理解了前端路由的核心：**URL 即状态，守卫即权限**，以及「不同路由模式在部署上的取舍」。

## 常见坑

- **静态托管用 history 模式刷新 404**：GitHub Pages / 普通静态服务器不回退 index.html；要么用 `hash` 模式，要么在服务器配置 SPA fallback。本项目已用 hash + base 解决。
- **动态参数变化组件不复活**：跳同组件不同参数时 `onMounted` 不重新执行，必须 `watch(route.params)` 重新拉数据。
- **`router.push` 重复导航报错**：连续点同一链接会抛 `NavigationDuplicated`，用 `.catch` 忽略即可。
- **`to.meta` 在守卫里为 undefined**：确认 `meta` 写在路由对象上而非组件里；跨层级时子路由可继承父路由 meta（合并）。
- **`<router-link>` 忘记 `:to` 用 `to` 字符串**：动态路径要用 `:to="{ name: 'article', params: { id } }"`，不要手写字符串拼路径。

## 小结

- `<router-view>` 是出口，`<router-link>` 是导航，二者成对出现。
- 动态参数用 `useRoute().params`，跳转用 `router.push`；守卫用 `beforeEach` 做鉴权。
- **部署**：静态托管优先 `createWebHashHistory` + 正确的 `base`，避免刷新 404。
- 下一章用 **Pinia** 管理跨页面的全局状态（如用户信息、购物车）。
