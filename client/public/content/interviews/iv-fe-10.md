---
question: Vue3 Composition API 相比 Options API 有什么优势？
category: frontend
difficulty: middle
tags: "Vue, Composition API, setup, 逻辑复用"
order: 34
---

## 核心结论

**回答**：Composition API 的核心优势是"按功能组织代码"而非"按选项类型组织代码"，解决了 Options API 中同一功能逻辑分散在 data、methods、computed 等不同位置的碎片化问题。配合 `<script setup>` 语法糖和自定义 Hook 实现逻辑复用，替代了 Options API 中容易引发命名冲突和来源不清的 mixin 模式。

## Options API 的碎片化问题

### 代码对比：同一个功能的逻辑被分散

```vue
<!-- Options API：搜索功能相关代码散布在各处 -->
<script>
export default {
    data() {
        return {
            // 搜索相关（与下面 methods、watch 中的搜索逻辑分离）
            keyword: '',
            searchResults: [],
            isLoading: false,
            // 用户相关
            userName: '',
            userAvatar: '',
        };
    },
    watch: {
        // 搜索防抖（与 data、methods 分离）
        keyword: {
            handler: 'debounceSearch',
            immediate: false
        }
    },
    methods: {
        // 搜索逻辑（与 data、watch 分离）
        async search() { /* ... */ },
        debounceSearch() { /* ... */ },
        // 用户逻辑
        async fetchUser() { /* ... */ },
    },
    computed: {
        // 搜索结果统计
        resultCount() { return this.searchResults.length; },
        // 用户显示名
        displayName() { return this.userName || '未登录'; }
    }
};
</script>
```

当组件变复杂时，需要在 data、methods、computed 等区块间跳转来理解一个功能的完整逻辑，维护成本高。

## Composition API：按功能组织

```vue
<!-- Composition API：搜索功能聚合在一起 -->
<script setup>
import { ref, computed, watch } from 'vue';

// ====== 搜索功能（完整的逻辑块） ======
const keyword = ref('');
const searchResults = ref([]);
const isLoading = ref(false);

const resultCount = computed(() => searchResults.value.length);

watch(keyword, (val) => {
    if (val) debounceSearch(val);
});

const search = async () => {
    isLoading.value = true;
    searchResults.value = await fetch(`/api/search?q=${keyword.value}`);
    isLoading.value = false;
};

// ====== 用户功能（完整的逻辑块） ======
const userName = ref('');
const userAvatar = ref('');
const displayName = computed(() => userName.value || '未登录');

const fetchUser = async () => {
    const data = await fetch('/api/user');
    userName.value = data.name;
    userAvatar.value = data.avatar;
};
</script>
```

## 自定义 Hook：替代 Mixin

### Mixin 的痛点

```javascript
// mixin 的问题示例
const searchMixin = {
    data() { return { keyword: '' }; },
    methods: { search() { /* ... */ } }
};
const analyticsMixin = {
    data() { return { keyword: '' }; }, // 与 searchMixin 中的 keyword 冲突！
    methods: { search() { /* 其他逻辑 */ } } // 方法名也冲突！
};

// 使用时不知道 keyword 来自哪个 mixin，难以调试
export default {
    mixins: [searchMixin, analyticsMixin]
};
```

### Composition API Hook：清晰可控

```javascript
// composables/useSearch.js
import { ref, watch } from 'vue';

export function useSearch() {
    const keyword = ref('');
    const results = ref([]);
    const isLoading = ref(false);

    const search = async () => {
        isLoading.value = true;
        try {
            results.value = await fetch(`/api/search?q=${keyword.value}`).then(r => r.json());
        } finally {
            isLoading.value = false;
        }
    };

    watch(keyword, () => {
        if (keyword.value) debounceSearch();
    });

    // 明确返回，来源清晰
    return { keyword, results, isLoading, search };
}

// composables/useUser.js
export function useUser() {
    const user = ref(null);
    const fetchUser = async () => {
        user.value = await fetch('/api/user').then(r => r.json());
    };
    return { user, fetchUser };
}
```

```vue
<script setup>
// 使用 Hook：导入来源清楚，无命名冲突
import { useSearch } from '@/composables/useSearch';
import { useUser } from '@/composables/useUser';

const { keyword, results, search } = useSearch();
const { user, fetchUser } = useUser();
// keyword 和 search 明确来自 useSearch，不会有来源混乱
</script>
```

### Mixin vs Hook 对比

| 维度 | Mixin | Composition API Hook |
|------|-------|---------------------|
| 命名冲突 | 容易冲突，后覆盖前 | 解构重命名，无冲突 |
| 来源追溯 | 难以确定 | 导入路径明确 |
| 类型推断 | TypeScript 支持差 | 完整类型推断 |
| 逻辑复用粒度 | 组件级别 | 函数级别 |
| 数据与方法可见性 | 全部合并到 this | 显式导入，清晰可控 |

## 其他优势

### 更好的 TypeScript 支持

```typescript
// Options API 中 this 的类型推断复杂
export default {
    methods: {
        handleClick() {
            this.count++; // count 的类型需要额外声明
        }
    }
};

// Composition API 中自然支持类型推断
const count = ref<number>(0);  // count 类型为 Ref<number>
const double = computed<number>(() => count.value * 2);
```

### Tree-shaking

Options API 中所有选项（data、methods、computed、watch 等）都打包进最终产物。Composition API 中只打包实际使用的 API。

### `<script setup>` 语法糖

```vue
<script setup>
// 顶级变量直接暴露给模板
const count = ref(0);
// 不需要 return，不需要 export default
// 编译时优化，性能更好
</script>
```

## 面试追问

1. **Composition API 是否完全取代 Options API？** Vue 官方表示两者可共存。简单组件用 Options API 仍然简洁，复杂组件推荐 Composition API。但 `<script setup>` 已成为 Vue3 官方推荐的默认写法。

2. **setup 函数里能用 async 吗？** 可以配合 `<Suspense>` 组件。在 `<script setup>` 中直接使用 await 即可，组件自动变为异步组件。

3. **Vue3 的生命周期如何对应 Options API？** `onMounted` → mounted、`onUpdated` → updated、`onUnmounted` → destroyed、`onBeforeMount` → beforeMount 等。`beforeCreate` 和 `created` 没有对应钩子（setup 本身就替代了这两个）。新增了 `onRenderTracked` 和 `onRenderTriggered` 用于调试。

4. **如果一个 Hook 里需要访问组件实例怎么办？** 使用 `getCurrentInstance()` 获取当前组件实例（类似 Options API 的 this），但生产代码中不推荐依赖它，因为它可能为 null。
