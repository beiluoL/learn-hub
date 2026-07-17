---
title: Vue 响应式原理
category: interview
module: iv-fe
subcat: roadmap
timeline: false
level: hard
tier: key
readMinutes: 13
tags: "前端面试, Vue, 响应式"
summary: Object.defineProperty 与 Proxy 响应式
order: 6
---

- Vue2 用 Object.defineProperty 劫持 getter/setter
- Vue3 用 Proxy 代理，支持数组/新增属性
- 依赖收集：Dep 收集 Watcher，数据变更触发更新

```javascript
const data = { n: 1 };
const p = new Proxy(data, {
  set(t, k, v) { t[k] = v; console.log('update', k); return true; }
});
p.n = 2;
```

> Vue2 对新增属性需用 Vue.set 才能触发响应。

**自查清单**
- [ ] 能说响应式流程
- [ ] 能对比 2 与 3
