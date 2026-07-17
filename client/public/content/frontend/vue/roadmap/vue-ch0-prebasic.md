---
title: 第 0 章 · 前置基础与环境搭建
category: frontend
module: vue
subcat: roadmap
level: beginner
readMinutes: 14
tags: "Vue, 环境, Vite, 前置"
summary: 搭好 HTML/CSS/JS 基础与 Vite 工程化环境，跑起第一个 Vue 项目，并对比原生写法体会响应式的价值。
order: 2
prereq: frontend/vue/roadmap/vue-roadmap
---

这一阶段不急着学 Vue 语法，先把**地基**和**工具链**准备好。Vue 是构建在 HTML/CSS/JavaScript 之上的，基础越扎实，后面越顺。

## 核心知识点

**HTML 语义化**：用正确的标签表达结构，`<header>` `<nav>` `<main>` `<article>` `<form>` `<input>` `<label>` 比一堆 `<div>` 更易读、更利于 SEO 和无障碍。

**CSS 布局三件套**：盒模型（content/padding/border/margin）、Flexbox（一维对齐）、Grid（二维网格）。响应式靠媒体查询与 `clamp()`/`min()` 等现代函数。

**JavaScript(ES6+)**：解构赋值、`箭头函数`、`模板字符串`、Promise/async-await、`import/export` 模块化、`this` 指向。Vue 3 大量使用这些语法。

**工具链**：`Node.js`（运行环境）、`npm` 或 `pnpm`（包管理）、`Git`（版本控制）、`Vite`（前端构建工具，Vue 官方推荐）。

**Vue 单文件组件（SFC）**：一个 `.vue` 文件 = 模板 `<template>` + 逻辑 `<script>` + 样式 `<style>`，关注点分离又聚合在一个文件里。

## 代码示例

### 1）用 Vite 创建第一个 Vue 项目

```bash
# 安装依赖（首次需联网）
npm create vite@latest my-vue-app -- --template vue
cd my-vue-app
npm install
npm run dev      # 打开 http://localhost:5173
```

### 2）最小单文件组件：`App.vue`

```html
<script setup>
import { ref } from 'vue'
const msg = ref('Hello Vue 3')
</script>

<template>
  <h1>{{ msg }}</h1>
</template>

<style scoped>
h1 { color: #42b883; }
</style>
```

`main.js` 负责把根组件挂到页面上：

```javascript
import { createApp } from 'vue'
import App from './App.vue'

createApp(App).mount('#app')
```

## 实战小项目：计数器（原生 vs Vue）

先用**原生 JS** 写一个计数器，体会「数据变了要手动改 DOM」的麻烦：

```html
<div>
  <span id="count">0</span>
  <button id="plus">+1</button>
</div>
<script>
  let count = 0
  document.getElementById('plus').onclick = () => {
    count++
    document.getElementById('count').textContent = count // 手动更新 DOM
  }
</script>
```

同样的功能用 **Vue** 写，数据变了视图自动更新：

```html
<script setup>
import { ref } from 'vue'
const count = ref(0)
</script>

<template>
  <span>{{ count }}</span>
  <button @click="count++">+1</button>
</template>
```

**对比结论**：原生写法每次都要「找到 DOM → 改内容」；Vue 只要改数据 `count++`，页面自动跟着变。这就是**响应式**带来的开发效率提升，也是后面所有内容的核心。

## 小结

- 本阶段目标：环境能跑、能看懂 SFC 三块结构、理解「响应式 = 数据驱动视图」。
- 练手建议：把上面的计数器用 Vue 跑起来，再试着加一个「-1」按钮和「重置」按钮。
- 下一章开始系统学 Vue 的模板语法与指令。
