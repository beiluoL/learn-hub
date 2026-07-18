---
title: 第 1 章 · Vue 核心基础
category: frontend
module: vue
subcat: roadmap
level: beginner
readMinutes: 26
tags: "Vue, 模板, 指令, 响应式"
summary: 掌握模板语法、常用指令、ref/reactive 响应式、computed、watch 与生命周期，搭好 Vue 开发的地基。
order: 3
prereq: frontend/vue/roadmap/vue-ch0-prebasic
---

这一章是 Vue 的「语法入门」，把**模板怎么写、数据怎么变、视图怎么跟着变**讲清楚。这是后面一切的地基，务必练熟。

## 核心知识点

### 1. 模板语法
- **插值 `{{ }}`**：把数据渲染到页面，里面只能是**表达式**（如 `{{ count + 1 }}`），不能写 `if`/`for` 语句。
- **`v-html`**：把字符串当 HTML 渲染。**慎用**——直接插入用户输入有 XSS 风险，仅用于可信内容。
- **指令**：以 `v-` 开头、写在标签上的特殊属性，负责「动态行为」。

### 2. 常用指令

| 指令 | 简写 | 作用 |
| --- | --- | --- |
| `v-bind` | `:` | 动态绑定属性，如 `:class`、`:src`、`:disabled` |
| `v-on` | `@` | 绑定事件，如 `@click`、`:input` |
| `v-if` / `v-else` / `v-else-if` | — | 条件渲染（**真正增删 DOM**） |
| `v-show` | — | 条件显示（只切 `display:none`，节点一直在） |
| `v-for` | — | 列表渲染，**务必加 `:key`** |
| `v-model` | — | 表单双向绑定 |

**`v-if` vs `v-show` 怎么选**：频繁切换（如 Tab）用 `v-show`（不重建 DOM，省开销）；真正「有时完全不需要渲染」用 `v-if`（更省内存）。

**事件修饰符**（很常用）：
- `.stop`：阻止冒泡（等价于 `event.stopPropagation()`）
- `.prevent`：阻止默认行为（等价于 `event.preventDefault()`，如阻止表单提交刷新）
- `.once`：只触发一次
- 按键修饰符 `.enter` / `.esc`：只在对应键触发

**`v-model` 修饰符**：
- `.trim`：自动去首尾空格
- `.number`：自动转数字
- `.lazy`：失去焦点才更新（而非每次输入）

### 3. 响应式数据
- **`ref`**：包裹**基本类型**（也支持对象）。模板里自动解包，脚本里访问要 `.value`。
- **`reactive`**：用于**对象 / 数组**，直接 `.属性` 访问，但不能整体替换（会丢失响应性）。

```html
<script setup>
import { ref, reactive } from 'vue'
const count = ref(0)
const user = reactive({ name: 'Tom', age: 18 })
console.log(count.value) // 0（脚本里要 .value）
console.log(user.name)   // Tom（reactive 直接取）
</script>
```

> 经验：基本类型用 `ref`；对象用 `reactive` 或 `ref({...})` 都行，团队统一即可。第 3 章会深入 `ref`/`reactive` 的内部取舍。

### 4. 计算属性与侦听
- **`computed`**：根据依赖自动**缓存**结果——依赖不变就不重算，适合「由数据算出新数据」（如过滤、求和）。可写 getter/setter。
- **`watch`**：在数据变化时执行**副作用**（如发请求、埋点），能拿到新旧值；支持 `deep` / `immediate` / `flush` 选项。
- **`watchEffect`**：立即执行一次并自动收集依赖，依赖变就重跑——比 `watch` 更「懒人」，但拿不到旧值。

**`computed` vs `methods`**：模板里调用 `methods` 每次渲染都重算；`computed` 有缓存，依赖不变则不重算，**性能更好**，派生数据优先用 `computed`。

### 5. 生命周期
组件从创建到销毁会经历一系列钩子（在 `<script setup>` 里直接调用对应的 `onXxx` 函数）：

| 钩子 | 时机 | 典型用途 |
| --- | --- | --- |
| `onBeforeMount` | 挂载前 | 较少用 |
| `onMounted` | 挂载后（DOM 已生成） | **发请求、拿 DOM、初始化第三方库** |
| `onBeforeUpdate` / `onUpdated` | 数据更新前后 | 谨慎使用，易死循环 |
| `onBeforeUnmount` / `onUnmounted` | 卸载前后 | **清理定时器、移除监听** |

> 用 `keep-alive` 缓存的组件还有 `onActivated` / `onDeactivated`（见第 7 章）。

## 代码示例

### 1）响应式计数器与事件修饰符

```html
<script setup>
import { ref } from 'vue'
const count = ref(0)
const increment = () => count.value++
const onSubmit = () => alert('提交')
</script>

<template>
  <p>当前计数：{{ count }}</p>
  <button @click="increment">+1</button>

  <!-- .prevent 阻止表单默认刷新，.stop 阻止冒泡 -->
  <form @submit.prevent="onSubmit">
    <button type="submit">提交（不刷新页面）</button>
  </form>
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

> `:key` 用稳定唯一的值（如 `id`），**不要用数组下标**——下标在增删时会错乱，导致 Vue 复用错误的 DOM。

### 3）computed 的 setter 与 watch 侦听

```javascript
import { ref, computed, watch } from 'vue'

// computed 可读可写
const firstName = ref('Tom')
const lastName = ref('Lee')
const fullName = computed({
  get: () => `${firstName.value} ${lastName.value}`,
  set: (v) => { [firstName.value, lastName.value] = v.split(' ') },
})

// watch：数据变了做副作用
const keyword = ref('')
watch(keyword, (newVal, oldVal) => {
  console.log(`搜索词从 ${oldVal} 变为 ${newVal}`)
  // 这里常发请求：fetch(`/api/search?q=${newVal}`)
})

// watch 选项
watch(keyword, console.log, { immediate: true, deep: true })
```

## 实战小项目：可过滤的待办清单

目标：输入框用 `v-model` 收集文字，回车添加待办；下方用 `computed` 实时统计「已完成 / 总数」，并提供「只看未完成」切换。

要点拆解：
- 用 `ref([])` 存待办数组，每项 `{ id, text, done }`。
- 添加时 `todos.value.push({...})`，`id` 用 `Date.now()` 防重。
- 「完成」用 `v-model` 绑定到 `t.done` 的复选框（`.number` 不需要，布尔即可）。
- 统计与过滤全部用 `computed` 派生，**不要在模板里写复杂逻辑**。
- 进阶：把输入用 `.trim` 修饰，空内容不允许添加。

做完你就掌握了 Vue 最常用的「数据 → 视图」闭环，这也是后续组件的基石。

## 常见坑

- **在 `{{ }}` 里写语句**：`{{ if (x) {} }}` 会报错，插值只能是表达式。
- **`v-for` 忘写 `:key` 或用下标**：导致列表更新错乱、输入框内容串位。
- **`v-if` 和 `v-for` 写在同一元素**：Vue 3 中 `v-if` 优先级更高，会拿不到 `v-for` 的变量；应拆到不同层或用 `template` 包裹。
- **在 `watch` 里修改被监听的数据触发自身**：容易造成无限循环，必要时用 `deep` 但要小心。
- **`computed` 里写副作用**：`computed` 应为纯计算（无请求/无修改），副作用交给 `watch` / `watchEffect`。

## 小结

- 模板 + 指令 + 响应式是 Vue 最底层的三个概念，必须练熟。
- `computed` 适合「由数据算出新数据」，`watch` 适合「数据变了要做点别的事（请求/埋点）」。
- 下一章学习如何把界面拆成可复用的**组件**，并理清组件间的数据流向。

```quiz
问题：Vue 中用于声明响应式状态（基本类型 / 对象）的 API 是？
A. data() 选项
B. ref() / reactive()
C. useState()
D. this.state
答案：B
解析：Vue 3 用 ref() 包装基本类型、reactive() 包装对象来创建响应式状态；C/D 是 React 的写法。
```
