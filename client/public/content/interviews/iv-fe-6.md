---
question: Vue 组件间通信有哪些方式？各自适用于什么场景？
category: frontend
difficulty: middle
tags: "Vue, 组件通信, props, emit, provide inject, Pinia"
order: 30
---

## 核心结论

**回答**：Vue 组件通信有 8 种主要方式，按适用场景分为：父子通信用 props + emit（最基础）、祖孙通信用 provide/inject（Vue3 支持响应式）、兄弟组件用 mitt（替代已废弃的 EventBus）、跨层级共享用 Pinia/Vuex、快速访问用 $refs/$parent、透传用 $attrs。核心原则是"父子传 props、子通知父用 emit、跨层级用状态管理"。

## 8 种通信方式详解

### 1. Props + Emit（父子通信）

```vue
<!-- 父组件 -->
<template>
  <Child
    :message="parentMsg"
    :user="userInfo"
    @update="handleUpdate"
    @delete="handleDelete"
  />
</template>

<script setup>
import { ref } from 'vue';
const parentMsg = ref('来自父组件的消息');
const handleUpdate = (payload) => {
    console.log('子组件触发了 update:', payload);
};
</script>

<!-- 子组件 -->
<template>
  <div>
    <p>{{ message }}</p>
    <button @click="$emit('update', { id: 1, status: 'done' })">
      通知父组件
    </button>
  </div>
</template>

<script setup>
// Vue3 <script setup> 中使用 defineProps / defineEmits
const props = defineProps({
    message: { type: String, required: true },
    user: { type: Object, default: () => ({}) }
});
const emit = defineEmits(['update', 'delete']);
</script>
```

### 2. v-model（双向绑定语法糖）

Vue3 支持多个 v-model：

```vue
<!-- 父组件 -->
<Child v-model:text="name" v-model:count="num" />

<!-- 子组件 -->
<script setup>
const props = defineProps(['text', 'count']);
const emit = defineEmits(['update:text', 'update:count']);

// 本质上是 :text + @update:text 的语法糖
emit('update:text', '新值');
</script>
```

### 3. Provide / Inject（祖孙通信）

```vue
<!-- 祖先组件 -->
<script setup>
import { ref, provide, readonly } from 'vue';

const theme = ref('dark');
const user = reactive({ name: '张三', age: 25 });

// 提供响应式数据
provide('theme', readonly(theme));      // readonly 防止子孙随意修改
provide('user', user);
provide('updateTheme', (val) => {      // 提供修改方法
    theme.value = val;
});
</script>

<!-- 深层子孙组件 -->
<script setup>
import { inject } from 'vue';

const theme = inject('theme', 'light');  // 默认值 'light'
const user = inject('user');
const updateTheme = inject('updateTheme');

// 使用
updateTheme('light');  // 调用祖先提供的方法修改
</script>
```

**关键**：Vue3 的 provide/inject 直接支持响应式（因为传的是 ref/reactive 引用），不需要像 Vue2 那样需要特殊处理。

### 4. Mitt（兄弟/任意组件通信）

Vue3 移除了 EventBus（`$on/$off/$once` 被废弃），推荐使用 mitt 库：

```javascript
// utils/eventBus.js
import mitt from 'mitt';
const emitter = mitt();
export default emitter;
```

```vue
<!-- 组件 A（发送方） -->
<script setup>
import emitter from '@/utils/eventBus';

const addToCart = (product) => {
    emitter.emit('cart-add', product);
};
</script>

<!-- 组件 B（接收方） -->
<script setup>
import { onBeforeUnmount } from 'vue';
import emitter from '@/utils/eventBus';

const handler = (product) => {
    console.log('购物车收到:', product);
};

onMounted(() => {
    emitter.on('cart-add', handler);
});

onBeforeUnmount(() => {
    emitter.off('cart-add', handler); // 必须手动解绑，防止内存泄漏
});
</script>
```

### 5. Pinia / Vuex（跨层级状态管理）

详见后面 Pinia 专题。适合全局状态共享、跨页面/多组件协作。

### 6. $refs + $parent（直接访问）

```vue
<!-- 父组件通过 ref 获取子组件实例 -->
<template>
  <Child ref="childRef" />
  <button @click="callChild">调用子组件方法</button>
</template>

<script setup>
import { ref } from 'vue';
const childRef = ref(null);

const callChild = () => {
    childRef.value.focus();  // 调用子组件暴露的方法
};
</script>

<!-- 子组件需用 defineExpose 暴露 -->
<script setup>
import { ref } from 'vue';
const inputRef = ref(null);

const focus = () => inputRef.value?.focus();

defineExpose({ focus }); // 显式暴露给父组件
</script>
```

### 7. $attrs（属性透传）

```vue
<!-- 父组件 -->
<Child class="card" data-type="primary" :style="{ color: 'red' }" />

<!-- 子组件：将非 props 属性透传给内部元素 -->
<template>
  <div v-bind="$attrs">  <!-- class、style、data-type 自动绑定到 div -->
    <span>{{ title }}</span>
  </div>
</template>

<script setup>
defineProps(['title']);
// $attrs 自动排除 props 中声明的属性
</script>
```

## 场景选型总结

| 场景 | 推荐方式 | 备用方式 |
|------|----------|----------|
| 父 → 子 传数据 | props | provide/inject |
| 子 → 父 通知 | emit | callback prop |
| 父 ↔ 子 双向 | v-model | props + emit |
| 兄弟组件 | Pinia / mitt | 提升状态到公共父组件 |
| 祖孙（跨多层） | provide/inject | Pinia |
| 全局状态 | Pinia | Vuex |
| 模板引用 | ref + defineExpose | $parent / $root |
| 路由传参 | query / params + useRoute | Pinia |

## 面试追问

1. **$attrs 和 props 的区别？** props 需要显式声明，适用于有明确预期的数据；$attrs 包含所有未声明的属性，适用于透传给内部组件或原生元素的场景。

2. **mitt 频繁使用时有什么坑？** 事件名冲突（建议用常量管理事件名）、内存泄漏（组件销毁时忘记 off）。EventBus 模式缺乏类型约束，中大型项目建议用 Pinia。

3. **provide/inject 为什么不建议用于兄弟组件通信？** provide/inject 依赖组件树层级，兄弟组件可能不在同一条 provide 链上。而且过度使用会导致数据流向不清晰。

4. **为什么不建议用 $root / $parent？** 硬编码了组件层级关系，组件一旦被挪动或复用就会出错。破坏组件的独立性和可测试性。
