---
title: 第 7 章 · 进阶原理与性能优化
category: frontend
module: vue
subcat: roadmap
level: advanced
readMinutes: 24
tags: "Vue, 原理, 响应式, 性能"
summary: 理解 Vue 3 响应式（Proxy）、虚拟 DOM 与 diff、编译时优化，并掌握 nextTick、shallowRef、keep-alive 等性能优化手段。
order: 9
prereq: frontend/vue/roadmap/vue-ch6-ecosystem
---

懂原理才能写出更优的代码。这一章揭开 Vue「数据变 → 视图变」背后的机制，并给出**可落地的性能优化手段**。

## 核心知识点

### 1. 响应式原理（Proxy）
Vue 3 用 `Proxy` 包裹数据对象：
- **依赖收集（track）**：读取属性时，记录「当前正在运行的副作用（effect，如渲染函数）依赖了这个属性」。
- **派发更新（trigger）**：修改属性时，找到所有依赖它的副作用并重新执行。

相比 Vue 2 的 `Object.defineProperty`：
- Proxy 能监听**新增/删除属性**（`obj.x = 1`）与**数组索引/长度变化**，无需 `$set`。
- 惰性代理：只有被访问的嵌套对象才会被代理，性能更好。

```javascript
// 简化版响应式：体会 track / trigger
const targetMap = new WeakMap()
function track(target, key) { /* 记录当前 effect 依赖 key */ }
function trigger(target, key) { /* 通知依赖 key 的 effect 重跑 */ }

function reactive(obj) {
  return new Proxy(obj, {
    get(target, key, receiver) {
      track(target, key)                       // 读取 → 收集依赖
      return Reflect.get(target, key, receiver)
    },
    set(target, key, value, receiver) {
      const result = Reflect.set(target, key, value, receiver)
      trigger(target, key)                      // 修改 → 派发更新
      return result
    },
  })
}
const state = reactive({ count: 0 })
state.count        // 触发 track
state.count = 1    // 触发 trigger
```

> 注意：`ref` 内部也是用 `reactive` 包对象（`ref({...}).value` 会被转成 reactive）；`Map` / `Set` 等集合类型 Vue 做了专门的 `reactive` 处理，普通 `reactive` 也能正确响应。

### 2. 虚拟 DOM 与 diff
真实 DOM 操作慢，Vue 用 **VNode（JS 对象）** 描述界面：
- 数据变 → 生成**新 VNode 树**。
- 与**旧 VNode 树**做**最小差异比对（diff）**，只把真正变化的部分更新到真实 DOM。

diff 关键规则：
- **`sameVnode`**：通过「类型(tag) + key」判断是否同一节点；key 不同直接销毁重建。
- **子节点比对**：双端比较（头头、尾尾、头尾、尾头），尽量复用；列表必须有稳定 `key`。
- **静态节点跳过**：编译期已知不变的节点，运行时不再比对。

### 3. 编译时优化（Vue 3 比 Vue 2 快的关键）
Vue 编译器在**构建时**做静态分析，生成带优化标记的渲染函数：
- **PatchFlag**：给动态节点打标记（如「只文本会变」「只 class 会变」），diff 时只检查变化的那一类，跳过其他。
- **静态提升（hoistStatic）**：把不变的节点/VNode 提到渲染函数外，避免每次渲染重新创建。
- **树结构拍平（Block Tree）**：以「动态节点」为锚点组织结构，diff 时只遍历动态节点。
- **缓存事件处理（cacheHandler）**：内联事件编译期缓存，避免父组件重渲染导致子组件不必要的更新。

### 4. 异步更新队列与 nextTick
Vue 不会每次数据变都立即改 DOM，而是**异步批量更新**——同一事件循环里的多次修改，合并成一次 DOM 更新，避免抖动。

```html
<script setup>
import { ref, nextTick } from 'vue'
const msg = ref('old')
const update = async () => {
  msg.value = 'new'
  console.log(document.querySelector('p').textContent) // 仍是 'old'（DOM 未更新）
  await nextTick()                                      // 等 DOM 更新完
  console.log(document.querySelector('p').textContent) // 'new'
}
</script>
```

`nextTick(fn)`：在**下次 DOM 更新后**执行回调，常用于「改了数据后要基于新 DOM 做事」（如聚焦、测量尺寸）。

### 5. 性能优化手段（落到 API）
- **`v-once`**：只渲染一次、永不更新（纯静态内容，跳过后续比对）。
- **`v-memo`**：缓存子树，只有依赖数组变化才更新（比 `v-once` 灵活，适合大列表里「行不变就不重渲染」）。
- **`shallowRef` / `shallowReactive`**：只跟踪一层，深层变化不触发更新——大对象/大数组友好。
- **`markRaw` / `toRaw`**：把不需要响应的对象（如第三方实例、巨大配置）标记为非响应，省去代理开销。
- **`keep-alive`**：缓存组件实例，切换页面不重复创建/销毁（配合 `include` / `exclude` / `max` 精确控制）。
- **路由/组件懒加载**：减小首屏体积（见第 4 章）。
- **虚拟列表**：超长列表（上千条）只渲染可视区，配合 `shallowRef` 持有全量数据。

```html
<!-- v-memo：仅当 item.id 或 item.done 变化才更新该行 -->
<li v-for="item in list" :key="item.id" v-memo="[item.id, item.done]">
  {{ item.text }}
</li>

<!-- keep-alive 缓存路由组件 -->
<router-view v-slot="{ Component }">
  <keep-alive :max="10">
    <component :is="Component" />
  </keep-alive>
</router-view>
```

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
// big.value.list.push(1)      // ❌ 不触发更新（深层未跟踪）
big.value = { list: [1, 2] }   // ✅ 引用变了才触发
</script>
```

### 3）nextTick 在更新后操作 DOM

```html
<script setup>
import { ref, nextTick } from 'vue'
const show = ref(false)
const toggle = async () => {
  show.value = true
  await nextTick()
  document.getElementById('box')?.focus() // DOM 已渲染，可安全操作
}
</script>
```

## 实战小项目：性能优化对比 + 标签页缓存

目标：做一个「多标签后台」体验 `keep-alive` 与编译优化的价值。

- 用 `keep-alive` 包裹 `<router-view>`，在「报表页 / 设置页」间切换时，表单输入不丢失（组件被缓存）；用 `:max="10"` 限制缓存数量防止内存膨胀。
- 用一个大列表对比：普通 `ref` 整体替换 vs `shallowRef` 在「只关心引用变化」场景下的开销差异（DevTools Performance 观察）。
- 给「行数据不变就不重渲染」的场景加 `v-memo`，观察 DOM 更新次数下降。
- 打开 DevTools Performance，记录首次渲染与更新耗时，验证优化效果。

做完你会明白：**优化不是炫技，而是让对的场景用对的 API**。

## 常见坑

- **误以为 `reactive` 能监听一切**：`Map`/`Set` 要用 `reactive` 包裹（Vue 已支持），普通对象新增属性需确保是响应式对象上操作；解构出的属性丢失响应（见第 3 章 `toRefs`）。
- **`v-for` 不用 `:key` 或用 index**：diff 错乱、状态串位；key 必须是稳定唯一值。
- **过度使用 `deep: true` 的 watch**：深层监听开销大，尽量监听具体字段 `watch(() => obj.a, cb)`。
- **滥用 `keep-alive` 不限制数量**：缓存过多组件会吃内存，务必配 `:max`。
- **在渲染函数里做重计算**：大列表的复杂派生应放 `computed` 并配合 `shallowRef`/`v-memo`，而不是每次渲染重算。

## 小结

- 响应式 = `Proxy` 的「收集依赖 + 派发更新」；虚拟 DOM 让更新变「最小」；编译优化（PatchFlag / 静态提升 / Block Tree）省去无谓比对。
- 异步更新队列让多次修改合并成一次 DOM 更新；需要基于新 DOM 做事时用 `nextTick`。
- 常用「省钱」手段：`v-once` / `v-memo` / `shallowRef` / `markRaw` / `keep-alive` / 懒加载 / 虚拟列表。
- 下一阶段进入**实战项目与部署**（见路线第 8 阶段与 `cases/`），把前面所学串成作品。
