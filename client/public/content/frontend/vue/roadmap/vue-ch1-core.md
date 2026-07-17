---
title: 第 1 章 · Vue 核心基础
category: frontend
module: vue
subcat: roadmap
level: beginner
readMinutes: 16
tags: "Vue, 模板, 指令, 响应式"
summary: 掌握模板语法、常用指令、ref/reactive 响应式、computed、watch 与生命周期，搭好 Vue 开发的地基。
order: 3
prereq: frontend/vue/roadmap/vue-ch0-prebasic
---

这一章是 Vue 的「语法入门」，把模板怎么写、数据怎么变、视图怎么跟着变讲清楚。

## 核心知识点

**模板语法**：`{{ }}` 插值把数据渲染到页面；指令是以 `v-` 开头、写在标签上的特殊属性。

**常用指令**：
- `v-bind`（简写 `:`）动态绑定属性，如 `:class`、`:src`。
- `v-on`（简写 `@`）绑定事件，如 `@click`。
- `v-if` / `v-else` / `v-show` 条件渲染（前者真正增删 DOM，后者只切 `display`）。
- `v-for` 列表渲染，务必加 `:key`。
- `v-model` 表单双向绑定。

**响应式数据**：`ref` 用于基本类型（模板里自动解包，脚本里要 `.value`）；`reactive` 用于对象/数组。

**计算属性与侦听**：`computed` 根据依赖自动缓存结果；`watch` 在数据变化时执行副作用（如发请求）。

**生命周期**：`onMounted`（挂载后，常做数据请求）、`onUpdated`、`onUnmounted`（销毁时清理定时器/监听）。

## 代码示例

### 1）响应式计数器与事件

```html
<script setup>
import { ref } from 'vue'
const count = ref(0)
const increment = () => count.value++
</script>

<template>
  <p>当前计数：{{ count }}</p>
  <button @click="increment">+1</button>
</template>
```

### 2）列表渲染 + 计算属性过滤

```html
<script setup>
import { ref, computed } from 'vue'
const todos = ref([
  { id: 1, text: '学 Vue', done: true },
  { id: 2, text: '写项目', done: false },
])
const onlyActive = computed(() => todos.value.filter(t => !t.done))
</script>

<template>
  <ul>
    <li v-for="t in todos" :key="t.id">{{ t.text }}</li>
  </ul>
  <p>未完成：{{ onlyActive.length }} 项</p>
</template>
```

### 3）watch 侦听变化

```javascript
import { ref, watch } from 'vue'
const keyword = ref('')
watch(keyword, (newVal, oldVal) => {
  console.log(`搜索词从 ${oldVal} 变为 ${newVal}`)
})
```

## 实战小项目：可过滤的待办清单

目标：输入框用 `v-model` 收集文字，回车添加待办；下方用 `computed` 实时统计「已完成 / 总数」，并提供一个「只看未完成」的切换。

要点拆解：
- 用 `ref([])` 存待办数组，每项 `{ id, text, done }`。
- 添加时 `todos.value.push(...)`，`id` 用 `Date.now()` 防重。
- 「完成」用 `v-model` 绑定到 `t.done` 的复选框。
- 统计信息全部用 `computed` 派生，不要在模板里写复杂逻辑。

做完你就掌握了 Vue 最常用的「数据 → 视图」闭环，这也是后续组件的基石。

## 小结

- 模板 + 指令 + 响应式是 Vue 最底层的三个概念，必须练熟。
- `computed` 适合「由数据算出新数据」，`watch` 适合「数据变了要做点别的事（请求/埋点）」。
- 下一章学习如何把界面拆成可复用的**组件**。
