---
title: 浏览器渲染与重排重绘
category: interview
module: iv-fe
subcat: roadmap
timeline: false
level: medium
tier: key
readMinutes: 11
tags: "前端面试, 浏览器, 渲染"
summary: 关键渲染路径、回流与重绘优化
order: 4
---

- 流程：HTML→DOM、CSS→CSSOM→Render Tree→Layout→Paint→Composite
- 重排(Reflow)改变几何，重绘(Repaint)仅视觉
- transform/opacity 走合成层，性能更好

```javascript
// 批量读写避免强制同步布局
const el = document.getElementById('box');
const w = el.offsetWidth; // 读
el.style.height = w + 'px'; // 写
```

> 脱离文档流或绝对定位可减少重排影响范围。

**自查清单**
- [ ] 能说渲染流程
- [ ] 能列优化手段
