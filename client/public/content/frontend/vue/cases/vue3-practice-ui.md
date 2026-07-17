---
title: 练习 2 · 接入 Element Plus 组件库
category: frontend
module: vue
subcat: cases
level: intermediate
readMinutes: 9
tags: "Element Plus, UI 库, 组件, 练习"
summary: 在骨架里集成 Element Plus，用 el-button / el-card / el-form 统一界面风格，并了解按需自动引入的进阶姿势。
order: 3
---

目标：用成熟组件库替代手写按钮和卡片，快速搭出一致的后台风格界面。

## 1. 安装并全局注册

```bash
npm i element-plus
```

`src/main.ts`：

```ts
import { createApp } from 'vue'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import App from './App.vue'
import router from './router'
import { createPinia } from 'pinia'

createApp(App).use(createPinia()).use(router).use(ElementPlus).mount('#app')
```

## 2. 在视图里用它

`src/views/Home.vue` 改造成卡片 + 按钮：

```vue
<script setup lang="ts">
import { useCounterStore } from '@/stores/counter'
const counter = useCounterStore()
</script>

<template>
  <el-card class="max-w-md mx-auto mt-10">
    <template #header>Pinia 计数器</template>
    <p class="text-3xl font-bold text-center">{{ counter.count }}</p>
    <p class="text-center text-gray-500 mb-4">double = {{ counter.double }}</p>
    <div class="flex justify-center gap-3">
      <el-button type="primary" @click="counter.increment">+1</el-button>
      <el-button @click="counter.reset">重置</el-button>
    </div>
  </el-card>
</template>
```

## 3. 进阶：按需自动引入（可选）

全局引入会打包全部组件。生产项目推荐按需：

```bash
npm i -D unplugin-vue-components unplugin-auto-import
```

`vite.config.ts` 增加：

```ts
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'

export default defineConfig({
  plugins: [
    vue(),
    AutoImport({ resolvers: [ElementPlusResolver()] }),
    Components({ resolvers: [ElementPlusResolver()] }),
  ],
})
```

这样模板里直接用 `<el-button>`，构建时只打包用到的组件，体积更小。

> 练习要点：**组件库的 value 用 `v-model` 双向绑定**；表单校验用 `el-form` 的 `rules` + `validate()`，比手写省心。
