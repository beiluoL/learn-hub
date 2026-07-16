---
question: Vue Router 有哪些导航守卫？各自的应用场景？
category: frontend
difficulty: middle
tags: "Vue Router, 导航守卫, beforeEach, 路由"
order: 32
---

## 核心结论

**回答**：Vue Router 提供了三种级别的导航守卫（全局守卫、路由独享守卫、组件内守卫），覆盖了路由跳转的完整生命周期。全局 beforeEach 最常用，用于权限校验和页面标题设置；路由独享 beforeEnter 用于特定路由的数据校验；组件内 beforeRouteEnter 用于获取组件渲染前的初始数据。理解导航守卫的执行顺序和 `next()` 的正确用法是基础要求，理解完整的路由解析流程是进阶能力。

## 三种导航守卫

### 全局守卫（Global Guards）

```javascript
// router/index.js
const router = createRouter({ /* ... */ });

// 1. beforeEach：进入任何路由前触发（最常用）
router.beforeEach((to, from, next) => {
    // 权限校验
    const token = localStorage.getItem('token');
    if (to.meta.requiresAuth && !token) {
        // 未登录 → 跳转登录页，并记录目标地址
        next({ path: '/login', query: { redirect: to.fullPath } });
    } else {
        next();
    }
});

// 2. beforeResolve：所有组件内守卫和异步路由组件解析之后触发
// 适合获取全局数据后统一处理
router.beforeResolve(async (to) => {
    // 用户信息已加载，可以在这里做角色校验
    const userStore = useUserStore();
    if (to.meta.roles && !to.meta.roles.includes(userStore.role)) {
        return { path: '/403' };
    }
});

// 3. afterEach：导航完成后触发，不接受 next
router.afterEach((to, from) => {
    // 页面标题
    document.title = to.meta.title || '默认标题';
    // 页面埋点
    trackPageView(to.fullPath);
    // 加载进度条结束
    NProgress.done();
});
```

### 路由独享守卫（Per-Route Guards）

```javascript
const routes = [
    {
        path: '/admin',
        component: AdminLayout,
        meta: { requiresAuth: true, roles: ['admin'] },
        beforeEnter: (to, from) => {
            // 特定路由的前置校验逻辑
            const userStore = useUserStore();
            if (!userStore.hasPermission('ADMIN_PANEL')) {
                return { path: '/403' };
            }
        },
        children: [ /* ... */ ]
    },
    {
        path: '/order/:id',
        component: OrderDetail,
        beforeEnter: async (to) => {
            // 校验订单是否存在
            const exists = await checkOrderExists(to.params.id);
            if (!exists) return { path: '/404' };
        }
    }
];
```

### 组件内守卫（In-Component Guards）

```vue
<script>
export default {
    // 1. beforeRouteEnter：渲染该组件的路由被 confirm 前调用
    // 无法访问 this（组件还未创建）
    beforeRouteEnter(to, from, next) {
        next(vm => {
            // vm 是组件实例，setTimeout 数据加载
            // 常用于：SSR 数据预取
            vm.fetchData();
        });
    },

    // 2. beforeRouteUpdate：当前路由改变但组件被复用时调用
    // 例如 /user/1 → /user/2，复用 User 组件
    async beforeRouteUpdate(to, from) {
        // 能访问 this
        this.user = await fetchUser(to.params.id);
    },

    // 3. beforeRouteLeave：导航离开该组件时调用
    beforeRouteLeave(to, from) {
        if (this.hasUnsavedChanges) {
            const answer = confirm('有未保存的修改，确定离开吗？');
            if (!answer) return false;
        }
    }
};
</script>
```

## 完整路由解析流程

```
1. 导航被触发
2. 在失活的组件里调用 beforeRouteLeave
3. 调用全局 beforeEach
4. 在重用的组件里调用 beforeRouteUpdate
5. 在路由配置里调用 beforeEnter
6. 解析异步路由组件
7. 在被激活的组件里调用 beforeRouteEnter
8. 调用全局 beforeResolve
9. 导航被确认
10. 调用全局 afterEach
11. 触发 DOM 更新
12. 调用 beforeRouteEnter 中 next 的回调（vm 可用）
```

## 实际应用场景

### 场景一：权限校验 + 动态路由

```javascript
router.beforeEach(async (to, from, next) => {
    const userStore = useUserStore();
    const token = getToken();

    if (token) {
        if (to.path === '/login') {
            next({ path: '/' });
        } else {
            // 已登录但用户信息未加载 → 先获取用户信息和权限路由
            if (!userStore.name) {
                try {
                    await userStore.fetchUserInfo();
                    // 根据角色动态添加路由
                    const accessRoutes = await userStore.generateRoutes();
                    accessRoutes.forEach(route => router.addRoute(route));
                    // 关键：重新导航到目标（因为之前的路由还未注册）
                    next({ ...to, replace: true });
                } catch {
                    userStore.resetToken();
                    next(`/login?redirect=${to.path}`);
                }
            } else {
                next();
            }
        }
    } else {
        // 白名单路由直接放行
        if (whiteList.includes(to.path)) {
            next();
        } else {
            next(`/login?redirect=${to.path}`);
        }
    }
});
```

### 场景二：页面标题动态设置

```javascript
router.afterEach((to) => {
    document.title = to.meta.title
        ? `${to.meta.title} - LearnHub`
        : 'LearnHub';
});
```

### 场景三：页面加载进度条

```javascript
import NProgress from 'nprogress';
import 'nprogress/nprogress.css';

router.beforeEach(() => {
    NProgress.start();
});
router.afterEach(() => {
    NProgress.done();
});
router.onError(() => {
    NProgress.done();
});
```

### 场景四：离开页面确认

```javascript
beforeRouteLeave(to, from) {
    if (this.formChanged && !this.formSaved) {
        const answer = window.confirm('表单未保存，确定离开？');
        if (!answer) return false;
    }
}
```

## 面试追问

1. **beforeEach 中 next 有哪些用法？** `next()` 放行；`next('/login')` 重定向；`next(false)` 取消导航；`next(error)` 把错误传给 router.onError()。Vue Router 4 中也支持返回 Promise 和直接 return 代替 next。

2. **addRoute 动态添加路由后为什么要重新导航？** 动态添加的路由不会自动被匹配，需要触发重新导航让匹配器重新工作。常用 `next({ ...to, replace: true })` 来实现。

3. **路由守卫中如何处理异步逻辑？** `next()` 可以传入异步回调，或者在守卫中返回 Promise 对象。Vue Router 4 支持 async/await。

4. **beforeResolve 和 beforeEach 的区别？** beforeResolve 在所有组件内守卫执行完毕、异步路由组件解析完毕后才触发，适合做最后的统一获取数据或全局校验。
