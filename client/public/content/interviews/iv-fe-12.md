---
question: Vue 项目中你做过哪些性能优化？
category: frontend
difficulty: middle
tags: "Vue, 性能优化, 懒加载, 虚拟列表, 首屏"
order: 36
---

## 核心结论

**回答**：Vue 性能优化围绕三个核心方向：**减少加载体积**（路由懒加载/组件异步/图片优化/包分析）、**减少渲染开销**（正确用 key/computed/v-show vs v-if/KeepAlive/虚拟列表）、**减少网络耗时**（首屏 SSR/预渲染/骨架屏/资源压缩/CDN）。面试中要从"遇到了什么问题、用了什么手段、达到了什么效果"三个维度来阐述。

## 一、减少加载体积

### 1. 路由懒加载

```javascript
// 错误：同步导入，首页加载所有页面组件
import Home from '@/views/Home.vue';
import About from '@/views/About.vue';

// 正确：动态 import，按需加载
const routes = [
    {
        path: '/home',
        component: () => import('@/views/Home.vue')  // webpackChunkName 指定 chunk 名
    },
    {
        path: '/about',
        component: () => import(/* webpackChunkName: "about" */ '@/views/About.vue')
    }
];
```

效果：首屏 JS 体积减少 40~60%，仅加载当前路由所需代码。

### 2. 组件异步加载

```vue
<script setup>
import { defineAsyncComponent } from 'vue';

// 大型组件（如富文本编辑器、图表）异步加载
const RichEditor = defineAsyncComponent(() =>
    import('@/components/RichEditor.vue')
);

// 带加载状态
const ReportChart = defineAsyncComponent({
    loader: () => import('@/components/ReportChart.vue'),
    loadingComponent: ChartSkeleton,   // 加载中的骨架
    delay: 200,                        // 200ms 后才展示 loading（防止闪烁）
    errorComponent: ErrorFallback,     // 加载失败兜底
    timeout: 10000
});
</script>
```

### 3. 第三方库按需引入

```javascript
// 错误：全量引入 Element Plus
import ElementPlus from 'element-plus';
app.use(ElementPlus); // 打包体积 +500KB

// 正确：按需引入
import { ElButton, ElInput } from 'element-plus';
app.use(ElButton).use(ElInput); // 只打包用到的组件

// ECharts 只引入需要的图表类型
import * as echarts from 'echarts/core';
import { BarChart, LineChart } from 'echarts/charts';
import { GridComponent, TooltipComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
echarts.use([BarChart, LineChart, GridComponent, TooltipComponent, CanvasRenderer]);
```

### 4. 图片优化

```vue
<template>
  <!-- 1. 懒加载：进入视口才加载 -->
  <img v-lazy="imageUrl" />

  <!-- 2. WebP 格式（体积比 JPEG 小 30%）+ 降级 -->
  <picture>
    <source srcset="hero.webp" type="image/webp" />
    <img src="hero.jpg" alt="hero" />
  </picture>

  <!-- 3. 响应式图片 -->
  <img
    src="thumb.jpg"
    srcset="thumb.jpg 400w, medium.jpg 800w, large.jpg 1200w"
    sizes="(max-width: 600px) 400px, (max-width: 1200px) 800px, 1200px"
  />
</template>
```

### 5. 打包分析

```bash
npm install rollup-plugin-visualizer --save-dev
```

```javascript
// vite.config.js
import { visualizer } from 'rollup-plugin-visualizer';

export default {
    plugins: [
        visualizer({
            filename: 'stats.html',
            open: true,
            gzipSize: true
        })
    ]
};
```

通过分析报告定位体积大的模块，针对性做拆分或按需加载。

## 二、减少渲染开销

### 1. v-for 正确使用 key

```vue
<!-- 错误：用 index 做 key -->
<div v-for="(item, index) in list" :key="index" />

<!-- 正确：用唯一业务 ID -->
<div v-for="item in list" :key="item.id" />
```

### 2. computed 缓存计算结果

```vue
<script setup>
import { ref, computed } from 'vue';

const list = ref([...]);

// 错误：模板中直接调用函数（每次渲染都重新计算）
const filterList = () => list.value.filter(i => i.status === 'active');

// 正确：用 computed（依赖不变时返回缓存值）
const filterList = computed(() => list.value.filter(i => i.status === 'active'));
</script>
```

### 3. v-show vs v-if

| 维度 | v-if | v-show |
|------|------|--------|
| 原理 | 条件为 false 时 DOM 不渲染 | 始终渲染，通过 CSS display 切换 |
| 切换开销 | 大（重建/销毁 DOM 和监听器） | 小 |
| 初始渲染 | 条件 false 时不渲染 | 始终渲染 |
| 适用场景 | 切换频率低 | 切换频率高 |

```vue
<!-- 频繁切换的 Tab → 用 v-show -->
<div v-show="activeTab === 'home'">Home</div>

<!-- 不常切换的权限判断 → 用 v-if -->
<AdminPanel v-if="user.isAdmin" />
```

### 4. KeepAlive 缓存组件

```vue
<template>
  <router-view v-slot="{ Component }">
    <!-- 缓存列表页，避免切换回来时重复请求 -->
    <keep-alive :include="['UserList', 'OrderList']" :max="10">
      <component :is="Component" />
    </keep-alive>
  </router-view>
</template>
```

结合 `onActivated` 和 `onDeactivated` 处理缓存组件的状态刷新。

### 5. 虚拟列表（长列表优化）

```bash
npm install vue-virtual-scroller
```

```vue
<template>
  <!-- 只渲染可视区域的 DOM 项，万级列表依然流畅 -->
  <RecycleScroller
    :items="list"
    :item-size="60"
    key-field="id"
    v-slot="{ item }"
  >
    <div class="row">
      <span>{{ item.name }}</span>
      <span>{{ item.value }}</span>
    </div>
  </RecycleScroller>
</template>
```

### 6. v-once 和 v-memo

```vue
<!-- v-once：只渲染一次，数据变化不更新 -->
<div v-once>{{ staticContent }}</div>

<!-- v-memo：只有依赖项变化才重新渲染（Vue3.2+） -->
<div v-for="item in list" :key="item.id" v-memo="[item.id, item.selected]">
  {{ item.name }}
</div>
```

## 三、首屏优化

### 1. SSR（服务端渲染）

Nuxt.js 提供了开箱即用的 SSR：

```bash
npx nuxi init my-app
```

SSR 将 Vue 组件在服务端渲染为 HTML 字符串，客户端直接展示，减少白屏时间。

### 2. 预渲染（SSG）

```bash
npm install vite-plugin-prerender
```
适合内容型站点（文档站、博客），构建时生成静态 HTML。

### 3. 骨架屏

```vue
<!-- 组件加载未完成时展示骨架 -->
<template>
  <Suspense>
    <template #default>
      <HeavyComponent />
    </template>
    <template #fallback>
      <Skeleton />  <!-- 骨架屏提升体验 -->
    </template>
  </Suspense>
</template>
```

### 4. 资源优化

```javascript
// vite.config.js
export default {
    build: {
        // 代码分割策略
        rollupOptions: {
            output: {
                manualChunks: {
                    'vue-vendor': ['vue', 'vue-router', 'pinia'],
                    'ui-vendor': ['element-plus'],
                }
            }
        }
    }
};
```

```nginx
# Nginx 开启 Gzip 压缩
gzip on;
gzip_types text/css application/javascript application/json image/svg+xml;
gzip_min_length 1k;
```

## 优化效果监控

使用 Lighthouse 或 PageSpeed 指标衡量：

| 指标 | 优化前 | 优化后 | 优化手段 |
|------|--------|--------|----------|
| FCP（首次内容绘制） | 2.5s | 1.2s | 路由懒加载 + 骨架屏 |
| LCP（最大内容绘制） | 4s | 1.8s | 图片懒加载 + WebP + CDN |
| TBT（总阻塞时间） | 600ms | 200ms | 代码分割 + 第三方库优化 |
| 首屏 JS 体积 | 1.2MB | 450KB | Tree-shaking + 懒加载 + 分包 |

## 面试追问

1. **vue-virtual-scroller 的原理？** 只渲染可视区域 + 上下缓冲区的 DOM 节点，滚动时动态计算当前应显示哪些项、调整 translateY 实现偏移，将万级 DOM 渲染压到几十个。

2. **为什么不用 ref 代替 computed 来做计算？** ref 需要手动维护更新时机（watch + 赋值），computed 自动追踪依赖且带缓存。ref 容易遗漏依赖导致数据不一致。

3. **KeepAlive 对性能有负面影响吗？** 缓存组件占用内存，max 限制最大缓存数。缓存项包含不可见的定时器/请求等副作用要注意在 onDeactivated 中清理。

4. **如何做性能监控？** 使用 Performance API 采集 FCP/LCP/FID 等 Web Vitals 指标，接 APM（阿里 ARMS/Sentry）做上报和异常追踪。配合 Chrome DevTools Performance 面板定位长任务。
