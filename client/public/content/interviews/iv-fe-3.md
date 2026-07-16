---
question: 什么是回流（Reflow）和重绘（Repaint）？如何减少它们？
category: frontend
difficulty: middle
tags: "性能, 渲染, 回流"
order: 9
---

**回流：**几何属性变化（宽高、位置、增删节点）导致布局重新计算，代价大。

**重绘：**仅外观变化（颜色、背景）不涉及布局，代价较小。

**优化：**

-   用 transform/opacity 触发合成层（GPU），避免回流
-   批量 DOM 操作（DocumentFragment / 先隐藏再改）
-   避免频繁读写字面布局属性（读写分离，用变量缓存）
-   复杂动画用 will-change / requestAnimationFrame
