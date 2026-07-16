---
title: DOM、事件与渲染机制
category: frontend
level: beginner
readMinutes: 13
tags: "DOM, 事件, 渲染, 回流重绘"
summary: 理解浏览器渲染流程与事件模型，写出流畅交互。
order: 2
---

## 一、DOM 操作

```
const el = document.querySelector("#app");
el.textContent = "hi";
el.addEventListener("click", handler);
```

批量操作优先用 `DocumentFragment` 或先 `display:none` 再改，减少回流。

## 二、事件流与委托

事件三阶段：捕获 → 目标 → 冒泡。利用冒泡做**事件委托**，减少监听器数量：

```
list.addEventListener("click", (e) => {
  const li = e.target.closest("li");
  if (li) handle(li);
});
```

## 三、浏览器渲染流水线

JS → 样式计算 → 布局(Layout/回流) → 绘制(Paint) → 合成(Composite)。

-   **回流**：几何属性变化（宽高、位置），代价大
-   **重绘**：颜色等外观变化，不涉及布局
-   优先用 `transform`/`opacity`（仅合成层，GPU 加速）
