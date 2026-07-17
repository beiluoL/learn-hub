---
title: 第 6 章 · 生态与工程化
category: frontend
module: vue
subcat: roadmap
level: advanced
readMinutes: 16
tags: "Vue, Vite, TypeScript, 工程化"
summary: 掌握 Vite 配置、TypeScript 接入、axios 封装、UI 库选型与 Vitest 单元测试，让项目可维护可协作。
order: 8
prereq: frontend/vue/roadmap/vue-ch5-pinia
---

能跑的项目 ≠ 能上线的项目。这一章补齐**工程化**能力：构建配置、类型安全、请求封装、UI 库与测试。

## 核心知识点

**Vite 配置**：`vite.config.ts` 里设路径别名 `@` 指向 `src`，用 `server.proxy` 解决开发期跨域，用 `.env` 管理不同环境的接口地址。

**TypeScript 接入**：`<script setup lang="ts">` 给 `props`、store、接口数据加类型，编译期就能抓出低级错误。

**axios 封装**：统一设置 `baseURL`、超时；用「请求拦截器」自动带 token，用「响应拦截器」统一处理错误与解包。

**UI 库选型**：Element Plus（后台首选）、Naive UI（轻量）、Ant Design Vue、Vuetify（Material 风格）。按需引入避免打包体积膨胀。

**测试**：Vitest + @vue/test-utils 写组件单元测试，保障重构不回归。

## 代码示例

### 1）Vite 别名与代理

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
    proxy: { '/api': 'http://localhost:3000' }, // 跨域代理
  },
})
```

### 2）axios 拦截器封装

```javascript
// utils/request.js
import axios from 'axios'
const request = axios.create({ baseURL: '/api', timeout: 8000 })
request.interceptors.request.use((config) => {
  config.headers.token = localStorage.getItem('token') || ''
  return config
})
request.interceptors.response.use(
  (res) => res.data,
  (err) => Promise.reject(err)
)
export default request
```

### 3）TypeScript 组件 + Element Plus 按需引入

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

## 实战小项目：后台骨架页

用 **Element Plus + TypeScript** 搭一个最小后台：左侧 `el-menu` 菜单，右侧 `el-table` 展示列表，顶部一个「新增」按钮弹出 `el-dialog` 表单。表格数据通过封装好的 `request` 获取。

要点：
- 菜单与路由联动（结合第 4 章的 Vue Router）。
- 表单用 `el-form` + 校验规则，提交走 `request.post`。
- 给列表接口返回类型定义 `interface Row { id: number; name: string }`，享受类型提示。

做完你就具备「从 0 搭一个可协作的工程」的能力。

## 小结

- 工程化目标是**稳定、可维护、可协作**：配置清晰、类型安全、请求统一、有测试兜底。
- UI 库别重复造轮子，按需引入控制体积。
- 下一章深入**原理与性能优化**。
