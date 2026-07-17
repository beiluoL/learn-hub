---
title: 手写防抖与节流
category: interview
module: iv-fe
subcat: cases
timeline: false
level: medium
tier: key
readMinutes: 14
tags: "前端面试, 项目案例"
summary: 实现 debounce 与 throttle 控制高频触发
order: 1
---

- 防抖：停止触发后延迟执行
- 节流：固定间隔最多执行一次
- 可用于搜索联想、滚动监听

```javascript
function debounce(fn, wait) {
  let t;
  return (...a) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...a), wait);
  };
}
```

**自查清单**
- [ ] 防抖节流正确
- [ ] 能说明适用场景
