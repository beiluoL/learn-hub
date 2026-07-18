---
title: 第 6 章 · 生态与工程化
category: frontend
module: vue
subcat: roadmap
level: advanced
readMinutes: 26
tags: "Vue, Vite, TypeScript, 工程化"
summary: 掌握 Vite 配置、TypeScript 接入、axios 封装、UI 库选型、自动化引入与 Vitest 单元测试，让项目可维护可协作。
order: 8
prereq: frontend/vue/roadmap/vue-ch5-pinia
---

能跑的项目 ≠ 能上线的项目。这一章补齐**工程化**能力：构建配置、类型安全、请求封装、UI 库与测试。这些能力决定了项目能否「长期维护、多人协作、稳定交付」。

## 核心知识点

### 1. Vite 配置
`vite.config.ts` 的关键是：别名、代理跨域、环境变量、构建输出。

```typescript
// vite.config.ts
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  server: {
    port: 5173,
    proxy: { '/api': { target: 'http://localhost:3000', changeOrigin: true } },
  },
  build: {
    outDir: 'dist',
    // 部署到子路径（如 GitHub Pages 的 /learn-hub/）必须设 base
    // base: '/learn-hub/'
  },
})
```

- **别名 `@`**：避免 `../../` 地狱，重构更稳。
- **`server.proxy`**：开发期把 `/api` 代理到后端，规避浏览器跨域（CORS），线上再由后端/Nginx 处理。
- **环境变量**：`.env` / `.env.development` / `.env.production`，只有 `VITE_` 前缀的变量才会暴露到 `import.meta.env`（安全考虑）。`vite.config.ts` 里用 `loadEnv` 读取。

### 2. TypeScript 接入
`<script setup lang="ts">` 给 props、store、接口数据加类型，编译期就能抓出低级错误。

```html
<script setup lang="ts">
import { ref } from 'vue'

interface User { id: number; name: string; role: 'admin' | 'user' }

// 类型化 props（带默认值用 withDefaults）
const props = withDefaults(defineProps<{
  user: User
  pageSize?: number
}>(), { pageSize: 10 })

// 类型化 emits
const emit = defineEmits<{ (e: 'select', id: number): void }>()

const list = ref<User[]>([])
</script>
```

- **类型化 store**：`state: () => ({ user: null as User | null })`。
- **`vue-tsc`**：配合 `vue-tsc --noEmit` 做类型检查（通常放在 `build` 前或 CI）。
- **泛型组件**：`<script setup lang="ts" generic="T">` 可写泛型组件（进阶）。

### 3. axios 封装（统一请求）
- 创建实例设 `baseURL`、`timeout`。
- **请求拦截器**：自动带 token、统一加 header。
- **响应拦截器**：统一解包 `res.data`、处理错误码、退出登录等。
- 用 `AbortController` 做取消（替代旧版 CancelToken）。

```javascript
// utils/request.js
import axios from 'axios'
const request = axios.create({ baseURL: '/api', timeout: 8000 })

request.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

request.interceptors.response.use(
  (res) => res.data, // 统一解包
  (err) => {
    if (err.response?.status === 401) {
      // 未授权：清 token 跳登录
      localStorage.removeItem('token')
      location.href = '/#/login'
    }
    return Promise.reject(err)
  }
)
export default request
```

### 4. UI 库选型
| 库 | 风格 / 定位 | 适用 |
| --- | --- | --- |
| Element Plus | 企业后台首选，组件全 | 中后台管理系统 |
| Naive UI | TypeScript 友好、轻量、主题灵活 | 现代后台 |
| Ant Design Vue | Ant 设计语言 | 偏阿里体系团队 |
| Vuetify | Material Design | 移动/海外风格 |

**按需引入**控制体积：用 `unplugin-vue-components` + `unplugin-auto-import` 自动按需引入组件与 API，无需手写 `import`。

```typescript
// vite.config.ts 片段
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'
export default defineConfig({
  plugins: [vue(), Components({ resolvers: [ElementPlusResolver()] })],
})
```

### 5. 自动化引入（Auto-import）
`unplugin-auto-import` 让你不用每次 `import { ref } from 'vue'`，且自动生成类型声明。配合上面的 Components 解析器，开发体验大幅提升。注意：需把生成的 `.d.ts` 加入 Git，避免 CI 类型报错。

### 6. 测试（Vitest + @vue/test-utils）
- **Vitest**：基于 Vite 的测试运行器，配置复用 `vite.config`，零额外成本。
- **@vue/test-utils**：`mount` / `shallowMount` 挂载组件，`wrapper.find` / `trigger` 模拟交互。
- **断言**：配 `expect` 或 `chai`，可用 `@vitest/coverage-v8` 出覆盖率。

```typescript
// Counter.spec.ts
import { mount } from '@vue/test-utils'
import Counter from './Counter.vue'

test('点击 +1 计数增加', async () => {
  const wrapper = mount(Counter)
  await wrapper.find('button').trigger('click')
  expect(wrapper.text()).toContain('1')
})
```

### 7. Lint / Format
- **ESLint** + `eslint-plugin-vue` + `@typescript-eslint`：规范代码、抓潜在 bug。
- **Prettier**：统一格式（和 ESLint 的 format 规则用 `eslint-config-prettier` 关掉冲突）。
- **Stylelint**：约束 `<style>` 里的 CSS。
- 配合 Git Hooks（`lint-staged` + `husky`）在提交前自动检查，避免脏代码进库。

## 代码示例

### 1）TS 组件 + Element Plus 按需引入

```html
<script setup lang="ts">
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
const msg = ref('')
const submit = () => ElMessage.success(`提交：${msg.value}`)
</script>

<template>
  <el-input v-model="msg" placeholder="请输入" />
  <el-button type="primary" @click="submit">提交</el-button>
</template>
```

### 2）用封装好的 request 拉数据（配合组合式函数）

```html
<script setup lang="ts">
import request from '@/utils/request'
import { ref, onMounted } from 'vue'
interface Row { id: number; name: string }
const rows = ref<Row[]>([])
onMounted(async () => {
  rows.value = await request.get('/list')
})
</script>
```

## 实战小项目：后台骨架页

用 **Element Plus + TypeScript** 搭一个最小后台：左侧 `el-menu` 菜单，右侧 `el-table` 展示列表，顶部一个「新增」按钮弹出 `el-dialog` 表单。表格数据通过封装好的 `request` 获取。

要点：
- 菜单与路由联动（结合第 4 章的 Vue Router，菜单项 `index` 指向路由 path）。
- 表单用 `el-form` + 校验规则，提交走 `request.post`。
- 给列表接口返回类型定义 `interface Row { id: number; name: string }`，享受类型提示与编译期检查。
- 给核心逻辑（如 `useTable`）写 1~2 个 Vitest 用例，体验测试兜底重构。

做完你就具备「从 0 搭一个可协作的工程」的能力。

## 常见坑

- **`import.meta.env` 在 `vite.config.ts` 里读不到**：配置文件本身不被 Vite 客户端处理，要用 `loadEnv(mode, root)` 读取 `.env`。
- **环境变量没加 `VITE_` 前缀**：非 `VITE_` 开头的变量不会注入客户端，永远是 `undefined`。
- **CORS 只在前端配代理没用**：代理只在 `npm run dev` 生效；上线后跨域要后端加 CORS 头或用 Nginx 反代。
- **UI 库全量引入导致打包体积爆炸**：务必配按需引入（auto-import resolver）。
- **`shallowMount` 与 `mount` 混淆**：测试想隔离子组件用 `shallowMount`；要测完整交互用 `mount`。
- **自动引入的 `.d.ts` 未提交**：CI 上类型找不到声明会报错，记得把 `auto-imports.d.ts` / `components.d.ts` 提交。

## 小结

- 工程化目标是**稳定、可维护、可协作**：配置清晰、类型安全、请求统一、有测试兜底。
- UI 库别重复造轮子，按需引入控制体积；测试不求 100% 覆盖，但核心逻辑要有保障。
- 下一章深入**原理与性能优化**，理解前面这些「为什么快、为什么稳」。
