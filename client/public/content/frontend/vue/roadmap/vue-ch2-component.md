---
title: 第 2 章 · 组件化开发
category: frontend
module: vue
subcat: roadmap
level: intermediate
readMinutes: 26
tags: "Vue, 组件, props, slot"
summary: 学会把界面拆成可复用组件，掌握 props 传参、emit 回传、插槽复用结构与 provide/inject 跨层通信。
order: 4
prereq: frontend/vue/roadmap/vue-ch1-core
---

当页面变复杂，把所有代码堆在一个文件里会难以维护。**组件化**就是把 UI 拆成独立、可复用、可组合的小块——这是工程化的核心能力。

## 核心知识点

### 1. 组件注册
`<script setup>` 中直接 `import` 子组件即可在模板使用，**无需手动注册**：

```html
<script setup>
import Child from './Child.vue'   // 导入即用
</script>
<template>
  <Child />
</template>
```

（选项式 API 才需要 `components: { Child }` 注册；全局注册用 `app.component('Name', Comp)`，但全局注册不利于 tree-shaking，一般只在真正全站通用的组件上使用。）

### 2. 父传子：props（单向数据流）
子组件用 `defineProps` 声明接收的属性，可加类型校验与默认值。**props 是只读的**——子组件不能直接改，要改就通过事件通知父组件，或把 props 作为初始值赋给本地 `ref`。

```html
<!-- Child.vue -->
<script setup>
const props = defineProps({
  title: { type: String, required: true },
  count: { type: Number, default: 0 },
  // 对象/数组默认值必须用工厂函数
  list: { type: Array, default: () => [] },
  // 自定义校验
  age: { type: Number, validator: (v) => v >= 0 },
})
console.log(props.title)
</script>

<template>
  <h3>{{ title }}（{{ count }}）</h3>
</template>
```

```html
<!-- Parent.vue -->
<template>
  <Child title="统计" :count="5" :list="[1,2,3]" />
</template>
```

> 命名：JS 里用 `camelCase`（`myProp`），模板里用 `kebab-case`（`:my-prop`）——Vue 会自动转换。

### 3. 子传父：emit
子组件用 `defineEmits` 声明事件，通过 `emit('事件名', 数据)` 把消息传给父组件。父组件用 `@事件名` 监听。

```html
<!-- Child.vue -->
<script setup>
const emit = defineEmits(['submit', 'cancel'])
const onClick = () => emit('submit', 'hello')  // 可带载荷
</script>
<template>
  <button @click="onClick">提交</button>
</template>
```

```html
<!-- Parent.vue -->
<template>
  <Child @submit="onSubmit" />
</template>
<script setup>
const onSubmit = (payload) => console.log(payload) // 'hello'
</script>
```

### 4. `v-model` 在组件上（双向绑定）
本质是 `:modelValue` + `@update:modelValue` 的语法糖。子组件通过 `update:modelValue` 事件回传新值：

```html
<!-- 父 -->
<MyInput v-model="text" />

<!-- 子 MyInput.vue -->
<script setup>
const props = defineProps(['modelValue'])
const emit = defineEmits(['update:modelValue'])
</script>
<template>
  <input :value="props.modelValue"
         @input="emit('update:modelValue', $event.target.value)" />
</template>
```

- **多个 v-model**：`v-model:title` / `v-model:content`，对应 `defineProps(['title','content'])` 与 `update:title` / `update:content`。
- **自定义修饰符**：如 `v-model.trim`，通过 `props.modelModifiers` 读取（进阶，用到再查）。

### 5. 插槽 slot（结构复用）
- **默认插槽**：父组件往子组件里塞内容 `<Card>xxx</Card>`。
- **具名插槽**：`<slot name="header" />`，父组件用 `<template #header>` 指定。
- **作用域插槽**：子组件把数据**回传**给插槽，父组件拿到数据自定义渲染——这是「列表类组件」复用的关键。

```html
<!-- Card.vue -->
<template>
  <div class="card">
    <header><slot name="header">默认标题</slot></header>
    <slot :row="data" />          <!-- 作用域插槽，把 data 回传 -->
  </div>
</template>
<script setup>
const data = { name: 'Tom' }
</script>
```

```html
<!-- 使用 -->
<Card>
  <template #header>我的卡片</template>
  <template #default="{ row }">     <!-- 接收回传的 row -->
    <p>用户名：{{ row.name }}</p>
  </template>
</Card>
```

### 6. 跨层通信：provide / inject
祖先用 `provide` 提供数据，任意后代用 `inject` 取，**跳过一层层 props**（适合主题、当前用户、locale 等「全局但非状态库」的数据）。事件总线模式已废弃，勿用。

```html
<!-- 祖先 -->
<script setup>
import { provide, ref } from 'vue'
const theme = ref('dark')
provide('theme', theme)   // 可传响应式数据
</script>

<!-- 后代（任意层级） -->
<script setup>
import { inject } from 'vue'
const theme = inject('theme', 'light')  // 第二个参数是默认值
</script>
```

> 建议用 `Symbol` 或字符串常量作为 key，避免命名冲突；`inject` 拿到的是引用，修改会影响祖先（谨慎）。

### 7. 动态组件与异步组件
- `<component :is="组件">`：根据变量切换显示的组件（适合 Tab 切换）。
- `defineAsyncComponent`：按需懒加载，首屏不加载该组件代码。

```html
<script setup>
import { ref, defineAsyncComponent } from 'vue'
const Heavy = defineAsyncComponent(() => import('./Heavy.vue'))
const current = ref('A')
</script>
<template>
  <component :is="current === 'A' ? CompA : Heavy" />
</template>
```

## 代码示例汇总
见上方各小节。重点记住三种通信方式的主干：
- **props 向下**传数据
- **emit 向上**传事件
- **slot 横向**传结构（含作用域插槽回传数据）
- **provide/inject 跨层**穿透

## 实战小项目：可复用列表 + 分页组件

目标：做一个通用的「数据列表」组件，父组件只负责传 `list` 数据和「每页条数」，列表内部负责渲染和翻页。

拆解：
- `ListView.vue`：接收 `:items`（数组）和 `:page-size`，内部用 `ref` 维护 `currentPage`，`computed` 算出 `pagedItems` 切片。
- 翻页按钮通过 `emit('page-change', n)` 通知父组件（或直接内部维护状态也行）。
- 每行用**作用域插槽**把当前项回传给父组件，由父组件决定每行怎么渲染（比如显示标题还是头像）。
- 空数据时用默认插槽展示「暂无数据」占位。

```html
<!-- ListView.vue 核心 -->
<script setup>
import { ref, computed } from 'vue'
const props = defineProps({ items: Array, pageSize: { type: Number, default: 5 } })
const emit = defineEmits(['page-change'])
const currentPage = ref(1)
const totalPages = computed(() => Math.ceil(props.items.length / props.pageSize))
const pagedItems = computed(() => {
  const s = (currentPage.value - 1) * props.pageSize
  return props.items.slice(s, s + props.pageSize)
})
const go = (n) => { currentPage.value = n; emit('page-change', n) }
</script>

<template>
  <ul>
    <li v-for="(item, i) in pagedItems" :key="i">
      <slot :row="item" />     <!-- 每行结构交给父组件 -->
    </li>
  </ul>
  <div class="pager">
    <button v-for="p in totalPages" :key="p" @click="go(p)">{{ p }}</button>
  </div>
</template>
```

做完你就拥有了一个能在多个页面复用的列表组件，这正是组件化的价值：**一次编写，处处使用**。

## 常见坑

- **直接修改 props**：会触发 Vue 警告且不生效（props 单向）。要改就 `emit` 让父组件改，或用 `toRefs(props)` 派生本地状态。
- **`v-model` 子组件忘记 emit `update:modelValue`**：父组件的绑定不会更新，检查事件名拼写。
- **作用域插槽拿不到数据**：确认子组件 `<slot :row="xxx" />` 的 prop 名与父组件 `#default="{ row }"` 一致。
- **`provide/inject` 不是响应式陷阱**：provide 普通值（非 ref）后 inject 拿到的是快照；要响应式就 provide 一个 `ref` / `reactive`。
- **具名插槽用错语法**：Vue 3 用 `#header` 是 `v-slot:header` 的简写，必须写在 `<template>` 上（默认插槽可直接写在组件标签内）。

## 小结

- 数据流向：`props` 向下、`emit` 向上，是 Vue 组件通信的主干；插槽解决「结构复用」，作用域插槽解决「数据回传 + 结构自定义」。
- `provide/inject` 用于跨层穿透，但不要滥用成「全局变量」。
- 下一章用 **Composition API（`<script setup>`）** 把逻辑抽得更干净，并学习如何把通用逻辑抽成组合式函数。
