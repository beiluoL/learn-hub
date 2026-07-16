---
question: Pinia 相比 Vuex 有什么改进？为什么官方推荐 Pinia？
category: frontend
difficulty: middle
tags: "Pinia, Vuex, 状态管理, 模块化"
order: 35
---

## 核心结论

**回答**：Pinia 相比 Vuex 的改进可以总结为：去掉 mutations（概念变简）、完整的 TypeScript 类型推断（无需额外的类型声明）、扁平化 store 结构（无嵌套 modules）、更简洁的 API（更像 React Hook）。官方推荐 Pinia 是因为它更轻量（约 1KB）、更符合 Vue3 的 Composition API 设计理念，也是 Vuex 5 的实践方向。

## Vuex 的核心痛点

### 痛点一：Mutations 冗余

```javascript
// Vuex：必须通过 mutation 修改状态
const store = createStore({
    state: () => ({
        count: 0
    }),
    mutations: {
        INCREMENT(state) {         // 即使是最简单的计数加一也要写 mutation
            state.count++;
        }
    }
});

store.commit('INCREMENT'); // 必须通过 commit 调用
// store.state.count = 1;   // 直接修改不会生效，也不报错（难以调试）
```

### 痛点二：Modules 嵌套混乱

```javascript
// Vuex Modules 命名空间
modules: {
    user: {
        namespaced: true,
        state: () => ({ name: '' }),
        getters: {
            userName: state => state.name
        },
        actions: {
            async fetchUser({ commit }) {
                const user = await api.getUser();
                commit('SET_NAME', user.name); // 不能跨模块调用
            }
        }
    }
}

// 使用时繁琐且易出错
store.getters['user/userName']; // 字符串路径，无类型提示
store.dispatch('user/fetchUser');
```

### 痛点三：TypeScript 支持弱

```typescript
// Vuex 需要大量类型声明才能获得基本的 TS 支持
// 定义类型、声明 $store 类型、自定义 useStore...
// 对新手不友好，且与 Vue3 的 TS 集成体验差距明显
```

## Pinia 的改进

### 改进一：无 Mutation，直接修改

```javascript
// stores/counter.js
import { defineStore } from 'pinia';

export const useCounterStore = defineStore('counter', () => {
    const count = ref(0);
    const doubleCount = computed(() => count.value * 2);

    // 直接定义函数来修改状态，不需要 mutation
    function increment() {
        count.value++;
    }

    async function fetchCount() {
        const data = await api.getCount();
        count.value = data;
    }

    return { count, doubleCount, increment, fetchCount };
});
```

```vue
<script setup>
import { useCounterStore } from '@/stores/counter';
const counter = useCounterStore();

// 直接调用方法，直观简洁
counter.increment();
// 也可以直接修改（但仍然响应式）
counter.count = 100;
</script>
```

### 改进二：扁平结构，无嵌套 Modules

```javascript
// Pinia：每个 Store 是扁平的独立实例
// stores/user.js
export const useUserStore = defineStore('user', {
    state: () => ({ name: '', avatar: '' }),
    actions: {
        async fetchUser() {
            const data = await api.getUser();
            this.name = data.name;  // this 指向 store 实例
        }
    }
});

// stores/cart.js（独立的 store 文件）
export const useCartStore = defineStore('cart', () => {
    const items = ref([]);
    const itemCount = computed(() => items.value.length);

    function addItem(product) {
        items.value.push(product);
        // 可以跨 store 调用
        const analytics = useAnalyticsStore();
        analytics.track('add_to_cart', product.id);
    }

    return { items, itemCount, addItem };
});
```

**无嵌套的好处**：
1. 不需要命名空间，`useUserStore().name` 替代 `store.state.user.name`
2. Store 之间可以直接互相引用（按需导入即可）
3. 每个 Store 文件完全独立，代码组织更清晰

### 改进三：完整 TypeScript 推断

```typescript
// Pinia 零类型声明也能获得完整的类型提示
const store = useCounterStore();
store.count;           // Ref<number>
store.increment();     // () => void
store.doubleCount;     // ComputedRef<number>
// DevTools 中也能正确显示类型
```

### 改进四：Option Store 与 Setup Store 双语法

```javascript
// 选项式 API 风格（类似 Vuex，兼容 Vue2 用户习惯）
export const useStore1 = defineStore('app', {
    state: () => ({ count: 0 }),
    getters: {
        double: (state) => state.count * 2
    },
    actions: {
        increment() { this.count++; }
    }
});

// Composition API 风格（与 <script setup> 统一）
export const useStore2 = defineStore('app', () => {
    const count = ref(0);
    const double = computed(() => count.value * 2);
    function increment() { count.value++; }
    return { count, double, increment };
});
```

## Vuex vs Pinia 对比总结

| 维度 | Vuex 4 | Pinia |
|------|--------|-------|
| 包大小 | ~15 KB | ~1.5 KB |
| Mutations | 必须使用 | 已移除 |
| TypeScript | 需额外声明类型 | 原生完美支持 |
| 模块结构 | 嵌套 Modules + 命名空间 | 扁平多个独立 Store |
| DevTools | 基础支持 | 完整支持（时间旅行、状态修改） |
| Store 互调 | 需要 rootState 传参 | 直接导入使用 |
| 热更新 | 需要额外配置 | 开箱即用 |
| Composition API | 不原生支持 | Setup Store 原生支持 |
| 插件系统 | 较复杂 | 更灵活（$subscribe 等） |

## 完整示例：购物车与用户

```javascript
// stores/useCartStore.js
export const useCartStore = defineStore('cart', () => {
    const items = ref([]);
    const userStore = useUserStore(); // 直接引用其他 store

    const totalPrice = computed(() =>
        items.value.reduce((sum, i) => sum + i.price * i.quantity, 0)
    );

    function addToCart(product) {
        const existing = items.value.find(i => i.id === product.id);
        if (existing) {
            existing.quantity++;
        } else {
            items.value.push({ ...product, quantity: 1 });
        }
    }

    async function checkout() {
        await api.createOrder({
            userId: userStore.id,
            items: items.value
        });
        items.value = [];
    }

    return { items, totalPrice, addToCart, checkout };
});
```

## 面试追问

1. **Pinia 如何替代 Vuex 的插件？** $subscribe 监听状态变化、$onAction 监听 Action 执行、$patch 批量修改。Pinia 插件通过 `pinia.use()` 注册。

2. **批量更新怎么处理？** 使用 `$patch` 方法：`store.$patch({ count: 1, name: 'new' })`，一次修改多个状态只触发一次更新。

3. **Pinia 的状态持久化怎么做？** 使用社区插件 `pinia-plugin-persistedstate`，或者自定义插件在 `$subscribe` 中写 localStorage。

4. **Vue 2 能用 Pinia 吗？** 可以，Pinia 同时支持 Vue 2（需安装 `@vue/composition-api`）和 Vue 3。Vuex 只能用于 Vue 2。
