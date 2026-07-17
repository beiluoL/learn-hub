---
title: 练习 4 · 组件通信实战
category: frontend
module: vue
subcat: cases
level: intermediate
readMinutes: 11
tags: "组件通信, props, emits, slots, provide/inject, 练习"
summary: 用一个小项目串联四种 Vue 组件通信方式：props/$emit、v-model、插槽、provide/inject，弄清各自适用场景。
order: 5
---

目标：通过一个「用户资料卡」组件树，把四种通信方式各用一遍，理解什么时候该用哪个。

## 场景结构

```
<UserProfile>            // 提供用户数据（provide）
 ├─ <UserCard>           // 接收 props，点击 emit 事件
 └─ <UserActions>        // 通过 v-model 双向、插槽定制
```

## 1. props / $emit（父子最直接）

`UserCard.vue`：

```vue
<script setup lang="ts">
defineProps<{ name: string; email: string }>()
const emit = defineEmits<{ (e: 'select', id: number): void }>()
</script>

<template>
  <div class="p-4 border rounded" @click="emit('select', 1)">
    <strong>{{ name }}</strong>
    <span class="text-gray-500">{{ email }}</span>
  </div>
</template>
```

父组件：

```vue
<UserCard :name="user.name" :email="user.email" @select="onSelect" />
```

## 2. v-model（子改父的语法糖）

`UserEditor.vue`：

```vue
<script setup lang="ts">
const props = defineProps<{ modelValue: string }>()
const emit = defineEmits<{ (e: 'update:modelValue', v: string): void }>()
</script>

<template>
  <input :value="props.modelValue" @input="emit('update:modelValue', ($event.target as HTMLInputElement).value)" />
</template>
```

父组件用 `<UserEditor v-model="name" />` 即可。

## 3. 插槽 slot（内容分发）

`UserActions.vue`：

```vue
<template>
  <div class="actions">
    <slot name="extra" :count="3" />
    <button>默认操作</button>
  </div>
</template>
```

父组件：

```vue
<UserActions>
  <template #extra="{ count }">
    <span>待办 {{ count }}</span>
  </template>
</UserActions>
```

## 4. provide / inject（跨层传，跳过中间组件）

`UserProfile.vue`：

```vue
<script setup lang="ts">
import { provide, ref } from 'vue'
const user = ref({ name: '北落', email: 'a@b.com' })
provide('user', user)
</script>
```

深层子组件直接 `const user = inject('user')`，无需逐层 props。

## 选择建议

- 父→子且简单：props
- 子→父：`$emit`（或 `v-model`）
- 结构/样式由父定：slot
- 跨多层共享（主题、用户、locale）：provide/inject

> 练习要点：**不要什么都用 provide/inject**，它会让依赖关系变隐式。优先 props/emits，跨层才上 inject。
