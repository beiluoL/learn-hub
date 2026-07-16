---
question: Vue2 的 Object.defineProperty 和 Vue3 的 Proxy 响应式原理有什么区别？
category: frontend
difficulty: hard
tags: "Vue, 响应式, Proxy, Object.defineProperty, 依赖收集"
order: 29
---

## 核心结论

**回答**：Vue2 基于 Object.defineProperty 的 getter/setter 实现响应式，只能劫持已有属性，无法监听新增/删除属性和数组索引变化（需要 Vue.set 补救）；Vue3 基于 ES6 Proxy 代理整个对象，可以拦截 13 种操作（包括新增/删除/数组方法等），性能更好且无需 Vue.set 等特殊 API。Proxy 的唯一硬伤是不兼容 IE11。

## Object.defineProperty 的实现与局限

### Vue2 响应式核心

```javascript
// Vue2 的实现原理（简化版）
function defineReactive(obj, key, val) {
    const dep = new Dep(); // 每个属性一个依赖收集器

    // 递归处理嵌套对象
    observe(val);

    Object.defineProperty(obj, key, {
        get() {
            // 依赖收集：把当前 Watcher 加入 dep
            if (Dep.target) {
                dep.depend();
            }
            return val;
        },
        set(newVal) {
            if (newVal === val) return;
            val = newVal;
            // 新值也要递归观察
            observe(newVal);
            // 派发更新：通知所有 Watcher
            dep.notify();
        }
    });
}

function observe(obj) {
    if (typeof obj !== 'object' || obj === null) return;
    // 遍历对象所有属性，逐个劫持
    Object.keys(obj).forEach(key => defineReactive(obj, key, obj[key]));
}
```

### defineProperty 的 4 大局限

**1. 无法监听新增属性**

```javascript
const vm = new Vue({
    data: { user: { name: '张三' } }
});
vm.user.age = 25; // 不是响应式的！页面不会更新
// 必须用 Vue.set
Vue.set(vm.user, 'age', 25);
```

**2. 无法监听删除属性**

```javascript
delete vm.user.name; // 不是响应式的！
// 必须用 Vue.delete
Vue.delete(vm.user, 'name');
```

**3. 无法监听数组索引和 length 修改**

```javascript
vm.items[0] = 'newValue'; // 不会触发更新
vm.items.length = 0;      // 不会触发更新
// Vue2 通过重写 7 个数组方法（push/pop/shift/unshift/splice/sort/reverse）来部分解决
```

**4. 初始化时递归遍历所有属性**：深层对象在初始化时就全部递归劫持，对象很大时影响首屏性能。

## Proxy 的响应式实现与优势

### Vue3 响应式核心

```javascript
// Vue3 的实现原理（简化版）
function reactive(target) {
    // 如果不是对象，直接返回
    if (typeof target !== 'object' || target === null) {
        return target;
    }

    // 用 WeakMap 缓存已代理的对象，避免重复代理
    const proxyMap = new WeakMap();
    if (proxyMap.has(target)) return proxyMap.get(target);

    const proxy = new Proxy(target, {
        get(target, key, receiver) {
            // 依赖收集
            track(target, key);
            const result = Reflect.get(target, key, receiver);
            // 懒代理：只有访问到对象属性时才递归代理
            return reactive(result);
        },
        set(target, key, value, receiver) {
            const oldValue = target[key];
            const result = Reflect.set(target, key, value, receiver);
            if (oldValue !== value) {
                // 派发更新
                trigger(target, key);
            }
            return result;
        },
        deleteProperty(target, key) {
            const hadKey = Object.prototype.hasOwnProperty.call(target, key);
            const result = Reflect.deleteProperty(target, key);
            if (hadKey && result) {
                // 删除属性也能触发更新！
                trigger(target, key);
            }
            return result;
        },
        // has / ownKeys 等其他拦截器...
    });

    proxyMap.set(target, proxy);
    return proxy;
}

// 依赖收集与触发（简化）
const targetMap = new WeakMap(); // target → depsMap

function track(target, key) {
    if (!activeEffect) return;
    let depsMap = targetMap.get(target);
    if (!depsMap) {
        targetMap.set(target, (depsMap = new Map()));
    }
    let dep = depsMap.get(key);
    if (!dep) {
        depsMap.set(key, (dep = new Set()));
    }
    dep.add(activeEffect);
}

function trigger(target, key) {
    const depsMap = targetMap.get(target);
    if (!depsMap) return;
    const dep = depsMap.get(key);
    if (dep) {
        dep.forEach(effect => effect());
    }
}
```

### Proxy 的 4 大优势

1. **直接代理整个对象**：新增、删除属性自动响应式，无需 Vue.set / Vue.delete
2. **支持数组索引修改**：`arr[0] = 'new'` 也能触发更新
3. **支持 13 种拦截操作**：get / set / deleteProperty / has / ownKeys / getOwnPropertyDescriptor / defineProperty / preventExtensions / getPrototypeOf / isExtensible / setPrototypeOf / apply / construct
4. **懒代理（Lazy Proxy）**：只有在 getter 中真正访问到的嵌套对象才进行代理，浅层浅代理，深层按需代理

## 核心区别对比

| 维度 | Vue2 defineProperty | Vue3 Proxy |
|------|---------------------|------------|
| 劫持对象 | 具体属性 | 整个对象 |
| 新增属性 | 不支持（需 Vue.set） | 支持 |
| 删除属性 | 不支持（需 Vue.delete） | 支持 |
| 数组索引 | 不支持 | 支持 |
| 数组 length | 不支持 | 支持 |
| 初始化性能 | 递归遍历所有属性 | 懒代理，按需递归 |
| 兼容性 | IE9+ | 不支持 IE |
| 拦截操作 | 仅 get/set（2 种） | 13 种操作 |
| Map/Set 等 | 不支持 | 支持 |
| 实现复杂度 | 中 | 低（代码更简洁） |

## 依赖收集与派发更新机制

两类响应式的核心机制一致，都是 **Dep + Watcher** 模式（Vue3 叫 targetMap + effect）：

```
数据劫持 → getter 依赖收集（数据 → Watcher 的映射）
         → setter 派发更新（数据变化 → 通知所有依赖的 Watcher → 更新视图）
```

**关键设计**：每个组件对应一个 Watcher，Watcher 在执行渲染函数时访问的响应式数据会被自动收集。数据变化时，对应的 Watcher 重新执行，触发组件更新。

## 面试追问

1. **为什么 Vue3 不做 IE 兼容？** IE 市场份额已极低（<2%），微软自身已停止 IE 支持。丢掉 IE 包袱后可以用 Proxy、CSS Variables 等现代 API，代码体积更小、性能更好。

2. **ref 和 reactive 有什么区别？** ref 用于基本类型（通过 .value 访问，内部也是 class getter/setter）；reactive 用于对象。ref 包装基本类型成 RefImpl 对象实现响应式，reactive 用 Proxy。模板中 ref 自动解包 .value。

3. **Proxy 有性能问题吗？** 虽然有 13 种 trap 开销，但 Proxy 是引擎原生实现（C++），比 defineProperty 的 JS 遍历快得多。Vue3 实测比 Vue2 快 2 倍左右（尤雨溪 2020 年演讲数据），懒代理进一步降低了初始化开销。

4. **toRaw 和 markRaw 有什么用？** toRaw 获取原始对象（绕过 Proxy），用于需要传原始对象的特殊场景。markRaw 标记对象永不转为响应式，用于三方库实例（如 Axios 实例、Three.js 对象）避免不必要的代理开销。
