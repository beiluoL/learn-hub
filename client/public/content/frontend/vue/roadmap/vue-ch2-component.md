---
title: 第 2 章 · 组件化开发
category: frontend
module: vue
subcat: roadmap
level: intermediate
readMinutes: 16
tags: "Vue, 组件, props, slot"
summary: 学会把界面拆成可复用组件，掌握 props 传参、emit 回传、插槽复用结构与 provide/inject 跨层通信。
order: 4
prereq: frontend/vue/roadmap/vue-ch1-core
---

当页面变复杂，把所有代码堆在一个文件里会难以维护。**组件化**就是把 UI 拆成独立、可复用、可组合的小块。

## 核心知识点

**组件注册**：`<script setup>` 中直接 `import` 子组件即可使用，无需手动注册。

**父传子 props**：子组件用 `defineProps` 声明接收的属性，可加类型校验与默认值。props 是只读的，子组件不能直接改。

**子传父 emit**：子组件用 `defineEmits` 声明事件，通过 `emit('事件名', 数据)` 把消息传给父组件。

**v-model 组件**：在组件上用 `v-model` 实现双向绑定，本质是 `:modelValue` + `@update:modelValue` 的语法糖。

**插槽 slot**：`默认插槽` 让父组件往子组件里塞内容；`具名插槽` 区分多个位置；`作用域插槽` 把子组件的数据回传给父组件使用。

**跨层通信**：`provide/inject` 让祖先直接给任意后代传值，跳过一层层 props（事件总线已废弃）。

**动态组件**：`<component :is="组件">` 根据变量切换显示的组件；`defineAsyncComponent` 实现按需懒加载。

## 代码示例

### 1）父传子：带类型校验的 props

```html
<!-- Child.vue -->
<script setup>
const props = defineProps({
  title: { type: String, required: true },
  count: { type: Number, default: 0 },
})
</script>

<template>
  <h3>{{ title }}（{{ count }}）</h3>
</template>
```

```html
<!-- Parent.vue -->
<template>
  <Child title="统计" :count="5" />
</template>
```

### 2）子传父：emit 事件

```html
<!-- Child.vue -->
<script setup>
const emit = defineEmits(['submit'])
const onClick = () => emit('submit', 'hello')
</script>

<template>
  <button @click="onClick">提交</button>
</template>
```

### 3）具名插槽与作用域插槽

```html
<!-- Card.vue -->
<template>
  <div class="card">
    <header><slot name="header" /></header>
    <slot :row="data" />   <!-- 作用域插槽，把 data 回传 -->
  </div>
</template>
```

## 实战小项目：可复用列表 + 分页组件

目标：做一个通用的「数据列表」组件，父组件只负责传 `list` 数据和「每页条数」，列表内部负责渲染和翻页。

拆解：
- `ListView.vue`：接收 `:items`（数组）和 `:page-size`，内部用 `ref` 维护 `currentPage`，计算 `pagedItems` 切片。
- 翻页按钮通过 `emit('page-change', n)` 通知父组件（或直接内部维护状态也行）。
- 每行用**作用域插槽**把当前项回传给父组件，由父组件决定每行怎么渲染（比如显示标题还是头像）。

做完你就拥有了一个能在多个页面复用的列表组件，这正是组件化的价值：**一次编写，处处使用**。

## 小结

- 数据流向：`props` 向下、`emit` 向上，是 Vue 组件通信的主干。
- 插槽解决「结构复用」，作用域插槽解决「数据回传 + 结构自定义」。
- 下一章用 **Composition API（`<script setup>`）** 把逻辑抽得更干净。
