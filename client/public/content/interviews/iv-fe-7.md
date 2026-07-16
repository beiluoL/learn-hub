---
question: 虚拟 DOM 和 diff 算法的核心原理是什么？为什么需要 key？
category: frontend
difficulty: middle
tags: "Vue, 虚拟DOM, diff, key, patch"
order: 31
---

## 核心结论

**回答**：虚拟 DOM 是用 JavaScript 对象描述真实 DOM 结构的轻量级映射，核心价值是减少不必要的真实 DOM 操作、实现跨平台渲染。diff 算法通过同层比较 + 双端对比在 O(n) 时间内找出最小差异并 patch 到真实 DOM。key 是虚拟 DOM 的身份标识，没有 key 时 diff 采用"就地复用"策略，会导致状态错乱等 Bug。

## 虚拟 DOM 是什么

虚拟 DOM 是一个 JavaScript 对象树，每个节点包含标签名、属性、子节点等信息：

```javascript
// 真实 DOM
// <div id="app" class="container">
//   <h1>Hello</h1>
//   <p>World</p>
// </div>

// 对应的虚拟 DOM（简化）
const vnode = {
    tag: 'div',
    props: { id: 'app', class: 'container' },
    children: [
        { tag: 'h1', props: {}, children: ['Hello'] },
        { tag: 'p',  props: {}, children: ['World'] }
    ]
};
```

### 为什么需要虚拟 DOM

1. **减少 DOM 操作**：直接操作 DOM 的代价昂贵（触发重排/重绘），虚拟 DOM 在 JS 内存中批量 diff 后再一次性 patch。
2. **跨平台**：虚拟 DOM 是平台无关的数据结构，渲染引擎可以是浏览器 DOM、小程序 WXML、Canvas、iOS/Android Native。
3. **函数式编程**：虚拟 DOM 使得 UI = f(state) 成为可能，状态变化自动映射为新 VNode，框架负责 diff 和 patch。

## Diff 算法的核心原理

### Vue2 的 Diff（双端对比）

Vue2 的 patchChildren 采用 **双端比较**，最多 4 次比较：

```javascript
// 旧节点：[A, B, C, D]
// 新节点：[A, C, B, E]
//
// 第1步：旧头 A vs 新头 A → 相同 → 头指针后移
//       [B, C, D] vs [C, B, E]
// 第2步：旧头 B vs 新头 C → 不同 → 旧头 B vs 新尾 E → 不同
//        旧尾 D vs 新头 C → 不同 → 旧尾 D vs 新尾 E → 不同
//      4 种比较都不同 → 遍历旧节点查找新头 C 在旧列表的位置
// 第3步：找到 C 在位置2 → 移动 C 到 B 前面
//       旧节点 B 找不到 → 删除
//       新节点 E 找不到 → 新增

function patchKeyedChildren(c1, c2) {
    let i = 0;
    let e1 = c1.length - 1; // 旧节点尾指针
    let e2 = c2.length - 1; // 新节点尾指针

    // 1. 从头部开始比较
    while (i <= e1 && i <= e2) {
        if (sameVnode(c1[i], c2[i])) {
            patch(c1[i], c2[i]);
        } else {
            break;
        }
        i++;
    }

    // 2. 从尾部开始比较
    while (i <= e1 && i <= e2) {
        if (sameVnode(c1[e1], c2[e2])) {
            patch(c1[e1], c2[e2]);
        } else {
            break;
        }
        e1--;
        e2--;
    }

    // 3. 旧节点已遍历完，新节点有剩余 → 新增
    if (i > e1) {
        while (i <= e2) {
            mount(c2[i]);
            i++;
        }
    }
    // 4. 新节点已遍历完，旧节点有剩余 → 删除
    else if (i > e2) {
        while (i <= e1) {
            unmount(c1[i]);
            i++;
        }
    }
    // 5. 中间乱序部分 → 最长递增子序列
    else {
        // 构建 key → index 映射
        // 计算最长递增子序列，保持这些节点不动
        // 移动或删除不在序列中的节点
    }
}
```

### Vue3 的优化

Vue3 的 diff 增加了**静态标记（PatchFlags）**：

```javascript
// 编译时标记动态内容
// <div>{{ count }}</div>
// 被编译为：
{
    type: 'div',
    children: ctx.count,
    patchFlag: PatchFlags.TEXT  // 标记：只有文本是动态的！
}

// diff 时跳过 patchFlag === PatchFlags.HOISTED 的静态节点（面试高频！）
```

## key 的作用

### 没有 key 的问题："就地复用"

```vue
<!-- 场景：英文名和中文名切换 -->
<template>
  <div v-for="item in list">
    <input /> {{ item.name }}
  </div>
</template>

<!-- 没有 key：切换列表后，input 框值错乱 -->
<!-- Vue 只更新了文本，没有重新创建 input，导致之前输入的内容还在原来的位置 -->

<!-- 有 key：input 跟随对应的数据项 -->
<template>
  <div v-for="item in list" :key="item.id">
    <input /> {{ item.name }}
  </div>
</template>
```

没有 key 时，Vue 使用"就地复用"策略：复用已存在的 DOM 节点，只更新节点内变化的文本/属性。这在简单列表中高效，但会导致有状态组件（如 input、checkbox）的状态错乱。

### 为什么不建议用 index 做 key

```vue
<!-- 错误示范 -->
<div v-for="(item, index) in list" :key="index">
```

**问题**：列表中间插入/删除项时，后面所有项的 index 都变了。Vue 认为是不同节点，导致全部销毁重建，失去 diff 优化效果，且 input 等状态仍然错乱。

**正确做法**：使用业务唯一标识（如 ID、用户名、商品编码）。

## 面试追问

1. **diff 算法的时间复杂度是多少？** O(n)。传统树的 diff 是 O(n^3)，Vue/React 通过三个前提假设降到 O(n)：只同层比较、类型不同直接删除重建、通过 key 标识节点。

2. **Vue3 和 React 的 diff 有什么区别？** 核心思路类似（同层比较、key 匹配），但 Vue3 有编译时优化（PatchFlags、静态提升、Block Tree），比 React 的运行时 Fiber reconciler 更精确（知道哪些是动态的）。React 使用 lane 模型处理并发优先级，Vue3 不需要响应式中断机制。

3. **什么情况下虚拟 DOM 不如直接操作 DOM？** 非常简单的场景（如计数器更新一个 span 的文本）、高度定制化的操作（富文本编辑器、Canvas 渲染）。虚拟 DOM 的价值体现在复杂 UI 的批量更新中。

4. **最长递增子序列在 diff 中的作用？** 在乱序部分中，找出不需要移动的最长递增子序列节点，移动其余节点。这样能保证最少的 DOM 移动操作。
