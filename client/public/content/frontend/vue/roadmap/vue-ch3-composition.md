---
title: 第 3 章 · Composition API
category: frontend
module: vue
subcat: roadmap
level: intermediate
readMinutes: 24
tags: "Vue, Composition, script setup"
summary: 用 <script setup> 语法糖组织逻辑，理解 ref/reactive 取舍，并学会把通用逻辑抽成组合式函数复用。
order: 5
prereq: frontend/vue/roadmap/vue-ch2-component
---

Vue 3 推荐用 **Composition API** 写组件。相比选项式（`data`/`methods`/`computed` 各放一处），它让「同一功能的代码」聚在一起，逻辑复用也更干净。

## 核心知识点

### 1. `<script setup>` 是什么
它是**编译时语法糖**：写在里面的顶层变量 / 函数自动暴露给模板，无需 `return`。写起来最短、最常用，也是官方与社区主流。

```html
<script setup>
import { ref, computed } from 'vue'
const count = ref(0)
const double = computed(() => count.value * 2)
const add = () => count.value++
// double、add、count 自动可在模板使用
</script>
<template>
  <p>{{ count }} 的两倍是 {{ double }}</p>
  <button @click="add">+1</button>
</template>
```

**编译期宏**（只能在 `<script setup>` 用，无需 import）：
- `defineProps()`：声明 props
- `defineEmits()`：声明事件
- `defineExpose()`：显式暴露给父组件 `ref` 访问的成员
- `useSlots()` / `useAttrs()`：访问插槽与透传属性

### 2. ref vs reactive（内部取舍）
- **`ref`**：包裹任意类型，内部用 `.value` 访问（模板自动解包）。基本类型**只能**用 ref。
- **`reactive`**：只用于对象/数组，直接 `.属性` 访问，但**不能整体替换**（会切断响应性）。

```javascript
import { ref, reactive, isRef, toRef, toRefs, toRaw, markRaw } from 'vue'

const n = ref(0)
const obj = reactive({ a: 1, b: 2 })

isRef(n)        // true
toRefs(obj)     // 把每个属性变成独立 ref，解构后仍响应式
const aRef = toRef(obj, 'a')  // 单个属性变 ref
toRaw(obj)      // 拿到原始对象（慎用，失响应）
markRaw(bigObj) // 标记为非响应式，避免大对象被代理的开销
```

> **经验法则**：基本类型用 `ref`；对象用 `ref({...})` 或 `reactive` 都行，团队统一即可。需要整体替换对象时用 `ref`；需要解构后用 `toRefs`。

### 3. computed 与 watch
- **computed**：可写 getter/setter；适合派生数据。
- **watch**：`watch(源, 回调, 选项)`，源可以是 ref / reactive / getter 函数；选项 `immediate`（立即执行）、`deep`（深层监听）、`flush`（`'pre'|'post'|'sync'`，控制回调时机）。
- **watchEffect**：立即执行并自动收集依赖，依赖变就重跑；用 `onInvalidate` 清理副作用（如取消请求）。

```javascript
import { ref, watch, watchEffect } from 'vue'
const keyword = ref('')

watch(keyword, (newV, oldV) => {
  console.log(newV, oldV)
}, { immediate: true, deep: false })

watchEffect((onInvalidate) => {
  const timer = setTimeout(() => console.log(keyword.value), 500)
  onInvalidate(() => clearTimeout(timer)) // 依赖变化/卸载时清理
})
```

### 4. 生命周期在 setup 中
直接调用 `onXxx` 函数（同第 1 章表格）：`onMounted` / `onUpdated` / `onUnmounted` 等。注意它们**必须在 `setup` 同步调用**，不能放在 `setTimeout` 里。

### 5. 组合式函数（Composable）—— 最强大的地方
以 `useXxx` 命名的函数，把可复用逻辑（数据请求、计数、本地存储）抽出来，在多个组件里 `import` 使用。**比 `mixin` 好**：来源清晰、无命名冲突、可传参、可测试。

```javascript
// composables/useLocalStorage.js
import { ref, watch } from 'vue'
export function useLocalStorage(key, initial) {
  const val = ref(localStorage.getItem(key) ?? initial)
  watch(val, (v) => localStorage.setItem(key, v))
  return val
}
```

## 代码示例

### 1）用 `<script setup>` 组织逻辑（含 defineProps/Emits）

```html
<script setup>
import { ref, computed } from 'vue'
const props = defineProps({ initial: { type: Number, default: 0 } })
const emit = defineEmits(['change'])

const count = ref(props.initial)
const double = computed(() => count.value * 2)
const inc = () => { count.value++; emit('change', count.value) }
</script>

<template>
  <p>{{ count }} 的两倍是 {{ double }}</p>
  <button @click="inc">+1</button>
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

```html
<script setup>
import { useCounter } from '../composables/useCounter'
const { count, double, inc, reset } = useCounter(10)
</script>
```

### 3）组合式函数：useFetch 拉数据（含加载与错误态）

```javascript
// composables/useFetch.js
import { ref, watchEffect } from 'vue'
export function useFetch(url) {
  const data = ref(null)
  const loading = ref(true)
  const error = ref(null)
  watchEffect((onInvalidate) => {
    const controller = new AbortController()
    loading.value = true
    fetch(url, { signal: controller.signal })
      .then((r) => r.json())
      .then((d) => (data.value = d))
      .catch((e) => { if (e.name !== 'AbortError') error.value = e })
      .finally(() => (loading.value = false))
    onInvalidate(() => controller.abort()) // 依赖变化/卸载时取消请求
  })
  return { data, loading, error }
}
```

### 4）组合式函数：useMouse（响应式跟随鼠标）

```javascript
// composables/useMouse.js
import { ref, onMounted, onUnmounted } from 'vue'
export function useMouse() {
  const x = ref(0), y = ref(0)
  const update = (e) => { x.value = e.pageX; y.value = e.pageY }
  onMounted(() => window.addEventListener('mousemove', update))
  onUnmounted(() => window.removeEventListener('mousemove', update))
  return { x, y }
}
```

## 实战小项目：文章列表（组合式函数版）

把第 2 章的列表组件升级：用 `useFetch('/api/articles')` 拉数据，用 `useCounter` 管理「已加载条数」或「页码」。组件里只写「渲染」和「事件」，所有数据逻辑都来自组合式函数。

```
ArticleList.vue
├─ useFetch(url)        → 拿到 data / loading / error
├─ useCounter(1)        → 管理 currentPage
└─ 模板：loading 时显示骨架，error 时显示错误，否则渲染列表
```

收益：
- 逻辑可测试、可在别处复用（「用户列表」也能用 `useFetch`）。
- 组件文件变短、变清晰，关注点只有 UI。
- 组合式函数之间可互相调用（如 `useUser` 内部调用 `useFetch`），形成逻辑积木。

## 常见坑

- **解构 `reactive` 丢失响应性**：`const { a } = reactive({ a: 1 })` 后 `a` 不再是响应的；要用 `toRefs(obj)` 再解构。
- **在 `setup` 外/异步里调用生命周期钩子**：`onMounted` 等必须在 `setup` 同步执行，放 `setTimeout` 或事件回调里会失效。
- **组合式函数里用了全局副作用却没清理**：`useMouse` 这类必须在 `onUnmounted` 移除监听，否则内存泄漏。
- **`watch` 监听 reactive 对象整体**：默认不 deep，要 `watch(obj, cb, { deep: true })` 或 `watch(() => obj.a, cb)` 精确监听某个字段。
- **`async setup` 误区**：`<script setup>` 顶层 `await` 会让组件变成异步（需 `<Suspense>` 包裹），普通逻辑别随便加顶层 await。

## 小结

- 阶段 3 起**全程使用 `<script setup>`**，这是官方与社区主流写法。
- 组合式函数的本质是「把逻辑当积木」，比 `mixin` 更清晰、无命名冲突、可测试。
- 下一章接入 **Vue Router** 做多页路由，把 `useXxx` 的用法延伸到路由与守卫。

```quiz
问题：<script setup> 中定义的顶层变量，在模板里如何访问？
A. 需要手动 return 才能用
B. 自动暴露给模板，无需 return
C. 模板访问不到，只能脚本内用
D. 必须加 export
答案：B
解析：<script setup> 是编译时语法糖，顶层绑定会自动暴露给模板。
```
