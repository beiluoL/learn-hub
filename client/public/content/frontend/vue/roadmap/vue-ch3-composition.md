---
title: 第 3 章 · Composition API
category: frontend
module: vue
subcat: roadmap
level: intermediate
readMinutes: 15
tags: "Vue, Composition, script setup"
summary: 用 <script setup> 语法糖组织逻辑，理解 ref/reactive 取舍，并学会把通用逻辑抽成组合式函数。
order: 5
prereq: frontend/vue/roadmap/vue-ch2-component
---

Vue 3 推荐用 **Composition API** 写组件，它让「同一功能的代码」聚在一起，而不是像选项式那样被 `data`/`methods`/`computed` 拆散。

## 核心知识点

**`<script setup>`**：编译时语法糖，里面的顶层变量/函数自动暴露给模板，无需 `return`，写法最简洁。

**ref vs reactive**：
- `ref` 包裹任意类型，脚本里访问要 `.value`，模板里自动解包。
- `reactive` 只用于对象/数组，直接 `.属性` 访问，但不能整体替换（会丢失响应性）。
- 经验：基本类型用 `ref`；对象用 `reactive` 或 `ref({...})` 都行，团队统一即可。

**toRefs / toRef**：把 `reactive` 对象的属性变成独立的 `ref`，解构时保持响应性。

**watchEffect**：立即执行一次并自动收集依赖，依赖变就重跑——比 `watch` 更「懒人」。

**组合式函数（Composable）**：以 `useXxx` 命名的函数，把可复用逻辑（如数据请求、计数）抽出来，在多个组件里 `import` 使用。这是 Composition API 最强大的地方。

## 代码示例

### 1）用 `<script setup>` 组织逻辑

```html
<script setup>
import { ref, computed } from 'vue'
const count = ref(0)
const double = computed(() => count.value * 2)
const add = () => count.value++
</script>

<template>
  <p>{{ count }} 的两倍是 {{ double }}</p>
  <button @click="add">+1</button>
</template>
```

### 2）组合式函数：useCounter

```javascript
// composables/useCounter.js
import { ref, computed } from 'vue'
export function useCounter(initial = 0) {
  const count = ref(initial)
  const double = computed(() => count.value * 2)
  const inc = () => count.value++
  const reset = () => (count.value = initial)
  return { count, double, inc, reset }
}
```

在组件里复用：

```html
<script setup>
import { useCounter } from '../composables/useCounter'
const { count, double, inc, reset } = useCounter(10)
</script>
```

### 3）组合式函数：useFetch 拉数据

```javascript
// composables/useFetch.js
import { ref } from 'vue'
export function useFetch(url) {
  const data = ref(null)
  const loading = ref(true)
  const error = ref(null)
  fetch(url)
    .then((r) => r.json())
    .then((d) => (data.value = d))
    .catch((e) => (error.value = e))
    .finally(() => (loading.value = false))
  return { data, loading, error }
}
```

## 实战小项目：文章列表（组合式函数版）

把第 2 章的列表组件升级：用 `useFetch('/api/articles')` 拉数据，用 `useCounter` 管理「已加载条数」或「页码」。组件里只写「渲染」和「事件」，所有数据逻辑都来自组合式函数。

收益：
- 逻辑可测试、可在别处复用（比如「用户列表」也能用 `useFetch`）。
- 组件文件变短、变清晰，关注点只有 UI。

## 小结

- 阶段 3 起**全程使用 `<script setup>`**，这是官方与社区的主流写法。
- 组合式函数的本质是「把逻辑当积木」，比混入（mixin）更清晰、无命名冲突。
- 下一章接入 **Vue Router** 做多页路由。
