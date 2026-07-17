---
title: 第 7 章 · 进阶原理与性能优化
category: frontend
module: vue
subcat: roadmap
level: advanced
readMinutes: 15
tags: "Vue, 原理, 响应式, 性能"
summary: 理解 Vue 3 响应式（Proxy）、虚拟 DOM 与 diff、编译时优化，并掌握常用性能优化手段。
order: 9
prereq: frontend/vue/roadmap/vue-ch6-ecosystem
---

懂原理才能写出更优的代码。这一章揭开 Vue「数据变 → 视图变」背后的机制。

## 核心知识点

**响应式原理（Proxy）**：Vue 3 用 `Proxy` 包裹数据对象，读取时「收集依赖」（记录谁在用这个数据），修改时「派发更新」（通知用家重新渲染）。相比 Vue 2 的 `Object.defineProperty`，Proxy 能监听新增/删除属性与数组索引变化。

**虚拟 DOM 与 diff**：真实 DOM 操作慢，Vue 用 JS 对象（VNode）描述界面，数据变后生成新 VNode，与旧的做**最小差异比对（diff）**，只更新真正变化的部分。

**编译时优化**：Vue 编译器给静态节点打 `PatchFlag`、做静态提升，运行时跳过不变的节点，大幅减少比对开销。

**性能优化手段**：
- `v-once`：只渲染一次、永不更新（静态内容）。
- `shallowRef` / `shallowReactive`：只跟踪一层，深层变化不触发更新（大对象友好）。
- `keep-alive`：缓存组件实例，切换页面不重复创建/销毁。
- 路由/组件懒加载：减小首屏体积。

## 代码示例

### 1）手写迷你响应式（体会 Proxy）

```javascript
function reactive(obj) {
  return new Proxy(obj, {
    get(target, key, receiver) {
      console.log('读取', key)      // 依赖收集时机
      return Reflect.get(target, key, receiver)
    },
    set(target, key, value, receiver) {
      console.log('修改', key, value) // 派发更新时机
      return Reflect.set(target, key, value, receiver)
    },
  })
}
const state = reactive({ count: 0 })
state.count        // 打印：读取 count
state.count = 1    // 打印：修改 count 1
```

### 2）shallowRef 跳过深层响应

```html
<script setup>
import { shallowRef } from 'vue'
const big = shallowRef({ list: [] })
// 直接改深层不会触发更新：
// big.value.list.push(1)   // ❌ 不更新
// 必须整体替换才会触发：
big.value = { list: [1, 2] } // ✅ 更新
</script>
```

### 3）keep-alive 缓存路由组件

```html
<template>
  <router-view v-slot="{ Component }">
    <keep-alive>
      <component :is="Component" />
    </keep-alive>
  </router-view>
</template>
```

## 实战小项目：性能优化对比 + 标签页缓存

目标：做一个「多标签后台」体验 `keep-alive` 的价值。

- 用 `keep-alive` 包裹 `<router-view>`，在「报表页 / 设置页」间切换时，表单输入不丢失（组件被缓存）。
- 用一个大列表对比：普通 `ref` 整体替换 vs `shallowRef` 在「只关心引用变化」场景下的开销差异。
- 打开 DevTools Performance，观察首次渲染与更新时的耗时差异。

做完你会明白：**优化不是炫技，而是让对的场景用对的 API**。

## 小结

- 响应式 = `Proxy` 的「收集依赖 + 派发更新」；虚拟 DOM 让更新变「最小」；编译优化省去无谓比对。
- 常用的「省钱」手段：`v-once`、`shallowRef`、`keep-alive`、懒加载。
- 下一章进入**实战项目与部署**，把前面所学串成作品。
