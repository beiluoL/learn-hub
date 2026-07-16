---
question: computed、watch 和 watchEffect 有什么区别？分别适用什么场景？
category: frontend
difficulty: middle
tags: "Vue, computed, watch, watchEffect, 响应式"
order: 33
---

## 核心结论

**回答**：computed 用于派生状态（缓存计算结果，依赖不变不重新计算），watch 用于监听特定数据变化执行异步/副作用（可获取新旧值、控制执行时机），watchEffect 用于自动收集依赖并立即执行的副作用（无需显式指定监听源，追踪更智能）。三者的关系可以用一句话概括：computed 是"计算值"，watch 是"观察者"，watchEffect 是"自动追踪副作用"。

## 三者对比总览

| 维度 | computed | watch | watchEffect |
|------|----------|-------|-------------|
| 缓存 | 缓存，依赖不变不重新计算 | 不缓存 | 不缓存 |
| 依赖追踪 | 自动，getter 中的依赖 | 显式指定源 | 自动，回调中的依赖 |
| 返回值 | 必须有 return | 不需要 return | 不需要 return |
| 执行时机 | 访问时计算（懒执行） | 不立即执行（可配 immediate） | 立即执行一次 |
| 获取旧值 | 不支持 | 支持（preValue） | 不支持 |
| 异步操作 | 不支持（同步纯函数） | 支持 | 支持 |
| flush 控制 | 不需要 | 支持（pre/sync/post） | 支持 |
| deep 深度监听 | 自动 | 显式开启 deep:true | 自动 |
| 销毁 | 自动（无副作用） | 自动 | 返回 stop 函数手动停止 |

## computed：计算属性

### 基本用法

```vue
<script setup>
import { computed, ref } from 'vue';

// 场景一：购物车总价
const items = ref([
    { name: '商品A', price: 100, count: 2 },
    { name: '商品B', price: 200, count: 1 },
]);

const total = computed(() => {
    return items.value.reduce((sum, item) => sum + item.price * item.count, 0);
});
// total 只在 items 或其内部属性变化时重新计算，访问时返回缓存值

// 场景二：可写计算属性
const firstName = ref('张');
const lastName = ref('三');

const fullName = computed({
    get: () => `${firstName.value} ${lastName.value}`,
    set: (val) => {
        const [first, last] = val.split(' ');
        firstName.value = first;
        lastName.value = last;
    }
});
fullName.value = '李 四'; // firstName → '李', lastName → '四'
</script>
```

### 核心原理：依赖缓存

```javascript
// computed 内部实现简化
class ComputedRefImpl {
    _value = undefined;     // 缓存的值
    _dirty = true;          // 是否需要重新计算
    effect;                 // 依赖追踪的 effect

    get value() {
        if (this._dirty) {
            // 只有依赖变化时才重新计算
            this._value = this.effect.run();
            this._dirty = false;
        }
        track(this, 'value'); // 收集外部依赖
        return this._value;
    }
}
```

当 computed 的依赖（如 items）变化时，dirty 标记为 true，下次访问 value 时触发重新计算。

## watch：侦听器

### 基本用法

```vue
<script setup>
import { ref, watch, reactive } from 'vue';

const keyword = ref('');
const user = reactive({ name: '张三', age: 25 });

// 场景一：搜索防抖
watch(keyword, (newVal, oldVal) => {
    // 防抖：300ms 内无新输入才发请求
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
        searchAPI(newVal);
    }, 300);
});

// 场景二：监听 reactive 对象，需要 getter 函数
watch(
    () => user.age,       // 返回具体属性值
    (newAge, oldAge) => {
        console.log(`年龄从 ${oldAge} 变为 ${newAge}`);
    }
);

// 场景三：deep 深度监听
watch(
    () => user,
    (newVal, oldVal) => {
        // deep: true 时监听对象内部任何变化
        // 注意：newVal === oldVal（同一个对象引用）
    },
    { deep: true, immediate: true } // immediate 立即执行
);

// 场景四：监听多个源
watch(
    [keyword, () => user.age],
    ([newKeyword, newAge], [oldKeyword, oldAge]) => {
        // 任一源变化都触发
    }
);

// 场景五：路由参数变化
const route = useRoute();
watch(
    () => route.params.id,
    (newId) => {
        fetchDetail(newId);
    }
);
</script>
```

### watchOptions 详解

| 选项 | 默认值 | 作用 |
|------|--------|------|
| immediate | false | 是否立即执行一次回调 |
| deep | false | 是否深度监听（递归遍历对象属性） |
| flush | 'pre' | pre: 组件更新前 / post: 更新后 / sync: 同步 |

```javascript
// flush: 'post' — 在 DOM 更新后执行，可获取最新的 DOM
watch(source, callback, { flush: 'post' });
// 等价于 watchPostEffect

// flush: 'sync' — 同步执行，慎用（可能导致不必要的重复执行）
watch(source, callback, { flush: 'sync' });
```

## watchEffect：副作用侦听器

```vue
<script setup>
import { ref, watchEffect } from 'vue';

const userId = ref(1);
const userData = ref(null);

// 自动追踪回调中的依赖，立即执行
const stop = watchEffect(async () => {
    // 自动追踪 userId.value 的变化
    userData.value = await fetchUserData(userId.value);
    // 下一页访问 postId 同样会被追踪
    document.title = userData.value?.name || '用户';
});

// 停止监听
setTimeout(() => stop(), 10000);
</script>
```

**watchEffect 的核心特点**：
1. 无需显式指定依赖源，回调中访问的响应式数据自动被追踪
2. 立即执行一次（适合初始化数据加载）
3. 返回 stop 函数，支持手动停止

## 场景选择指南

```
需要计算值？ → computed（totalPrice、filteredList、fullName）
需要异步操作？ → watch / watchEffect（API 请求、路由变化）
需要新旧值对比？ → watch（表单对比、变化前的数据备份）
立即执行副作用？ → watchEffect 或 watch(immediate: true)（初始化加载）
可控执行时机？ → watch + flush（pre/post/sync）
DOM 更新后操作？ → watch(flush: 'post'）或 watchPostEffect
```

## 面试追问

1. **computed 能用 watch 实现吗？** 可以但不推荐。computed 内部就是基于 effect + Ref 实现的，用 watch 手动实现会白白丢失缓存机制，每次访问都会重新计算。

2. **watchEffect 和 computed 的核心区别？** computed 必须有返回值，且是懒执行（被访问时才计算）；watchEffect 立即执行，不返回值，关注的是副作用而非派生状态。

3. **为什么 watch 不能自动追踪深层对象？** 性能考虑。每次对 reactive 对象的任意属性做全深度比较开销过大。开启 deep:true 会递归遍历所有嵌套属性，大数据量时很消耗性能。

4. **如何在 watchEffect 中获取 DOM 更新后的状态？** 使用 `watchEffect(callback, { flush: 'post' })` 或直接使用 `watchPostEffect`。默认 flush:'pre' 在组件更新前触发，此时 DOM 还未更新。
