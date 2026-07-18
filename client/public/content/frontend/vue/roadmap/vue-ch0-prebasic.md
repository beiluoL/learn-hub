---
title: 第 0 章 · 前置基础与环境搭建
category: frontend
module: vue
subcat: roadmap
level: beginner
readMinutes: 22
tags: "Vue, 环境, Vite, 前置"
summary: 搭好 HTML/CSS/JS 基础与 Vite 工程化环境，跑起第一个 Vue 项目，并对比原生写法体会响应式的价值。
order: 2
prereq: frontend/vue/roadmap/vue-roadmap
---

这一阶段不急着学 Vue 语法，先把**地基**和**工具链**准备好。Vue 是构建在 HTML/CSS/JavaScript 之上的，基础越扎实，后面越顺；很多「Vue 学不会」其实是被前置知识卡住了。

## 核心知识点

### 1. HTML 语义化
用正确的标签表达结构，比一堆 `<div>` 更易读、更利于 SEO 和无障碍（屏幕阅读器）。

| 标签 | 用途 |
| --- | --- |
| `<header>` `<nav>` `<main>` `<footer>` | 页面级结构骨架 |
| `<section>` `<article>` | 内容分区 / 独立成篇的内容 |
| `<form>` `<input>` `<label>` `<select>` `<button>` | 表单与交互 |
| `<ul>` `<ol>` `<li>` | 列表（搭配 `v-for` 高频使用） |

> 经验：**先用语义标签搭骨架，再用 `<div>` 做纯样式容器**。表单相关标签在 Vue 里常和 `v-model` 搭配，务必熟悉。

### 2. CSS 布局三件套
- **盒模型**：`content` / `padding` / `border` / `margin`，注意 `box-sizing: border-box` 让 `width` 包含 padding 和 border（推荐全局设置）。
- **Flexbox（一维）**：`display:flex` + `justify-content`（主轴对齐）+ `align-items`（交叉轴对齐），做导航、卡片排列最常用。
- **Grid（二维）**：`display:grid` + `grid-template-columns: repeat(3, 1fr)`，做整体页面布局（侧边栏 + 主区）更顺手。
- **响应式**：媒体查询 `@media (max-width: 768px)`；现代函数 `clamp()` / `min()` / `max()` 做流式排版。
- **CSS 变量**：`:root { --primary: #42b883 }`，用 `var(--primary)` 取值，方便主题切换。

### 3. JavaScript（ES6+）
Vue 3 源码与日常写法大量使用这些语法，不熟会处处碰壁：

- **解构赋值**：`const { name, age } = user`
- **箭头函数**：`const add = (a, b) => a + b`（注意它没有自己的 `this`）
- **模板字符串**：`` `Hello ${name}` ``
- **扩展/剩余运算符**：`[...arr]`、`function f(...args)`
- **Promise / async-await**：异步请求的主流写法
- **模块化**：`import { ref } from 'vue'` / `export const x = 1`
- **`this` 指向**：普通函数随调用者变，箭头函数继承外层 `this`（Vue 选项式里很重要）
- **数组方法**：`map` / `filter` / `reduce` / `find` / `some`（配合 `v-for` 做数据处理）

### 4. 工具链
- **Node.js**：运行与构建环境（建议 LTS 版本，本项目部署时本地也用它跑 Vite）。
- **npm / pnpm**：包管理，pnpm 更省磁盘、依赖更严格；命令基本一致（`install` / `run` / `add`）。
- **Git**：`clone` / `add` / `commit` / `push` / `branch`，用于版本管理与部署。
- **Vite**：Vue 官方推荐的前端构建工具，启动快（基于原生 ESM）、配置少、插件生态全。

### 5. Vue 单文件组件（SFC）
一个 `.vue` 文件 = 三块，关注点分离又聚合在一起：

```html
<script setup>
import { ref } from 'vue'
const msg = ref('Hello Vue 3')
</script>

<template>
  <h1>{{ msg }}</h1>
</template>

<style scoped>
h1 { color: #42b883; }  /* scoped：样式只作用于本组件 */
</style>
```

- `<template>`：模板（类似 HTML，但能用指令和 `{{ }}`）。
- `<script setup>`：逻辑（Composition API 的推荐写法）。
- `<style scoped>`：`scoped` 让样式**只作用于当前组件**，避免全局污染。

## 代码示例

### 1）用 Vite 创建第一个 Vue 项目

```bash
# 用官方脚手架（首次需联网）
npm create vite@latest my-vue-app -- --template vue
cd my-vue-app
npm install
npm run dev      # 打开 http://localhost:5173
```

生成的关键文件：
- `index.html`：入口页，`<div id="app"></div>` 是挂载点。
- `src/main.js`：把根组件挂到页面。
- `src/App.vue`：根组件。
- `vite.config.*`：构建配置（别名、代理等，见第 6 章）。

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

### 3）项目结构建议（随阶段演进）

```
src/
├── components/    # 可复用组件
├── views/         # 路由页面（第 4 章）
├── composables/   # 组合式函数（第 3 章）
├── stores/        # Pinia（第 5 章）
├── router/        # 路由（第 4 章）
├── utils/         # 工具与请求封装（第 6 章）
├── assets/        # 静态资源
└── App.vue        # 根组件
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

## 常见坑

- **Node 版本过低**：部分 Vite 版本要求 Node 18+，报怪异错误时先 `node -v` 检查。
- **端口被占用**：`npm run dev` 提示端口占用，用 `npm run dev -- --port 3000` 换端口。
- **文件大小写敏感**：`import App from './app.vue'` 在 macOS 能跑、在 Linux 部署可能 404，导入路径大小写要一致。
- **`scoped` 不隔离子组件根节点**：`scoped` 样式会影响子组件的根元素；要深度改子组件需用 `:deep()`。

## 小结

- 本阶段目标：环境能跑、能看懂 SFC 三块结构、理解「响应式 = 数据驱动视图」。
- 练手建议：把上面的计数器用 Vue 跑起来，再试着加一个「-1」按钮和「重置」按钮（用 `ref` 管理状态）。
- 下一章开始系统学 Vue 的**模板语法与指令**，你会接触到更多「数据 → 视图」的写法。
