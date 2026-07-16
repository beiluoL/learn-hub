---
title: 响应式设计与移动端适配实战
category: frontend
level: beginner
readMinutes: 14
tags: "响应式, 移动适配, 媒体查询, rem"
summary: 响应式设计与移动端适配实战。
order: 32
prereq:
---

## 媒体查询 @media

媒体查询是响应式设计的基础，它根据设备特征(宽度、分辨率、方向等)应用不同的样式规则。

```css
/* 基础断点 */
/* 移动端(默认) */
.container {
  padding: 16px;
  font-size: 14px;
}

/* 平板 */
@media (min-width: 768px) {
  .container {
    padding: 24px;
    font-size: 16px;
  }
}

/* 桌面端 */
@media (min-width: 1024px) {
  .container {
    max-width: 960px;
    margin: 0 auto;
  }
}
```

### 常用断点参考

| 断点 | 设备类型 | 典型宽度 |
|------|---------|---------|
| sm | 手机横屏/小平板 | 640px+ |
| md | 平板竖屏 | 768px+ |
| lg | 平板横屏/小桌面 | 1024px+ |
| xl | 桌面 | 1280px+ |
| 2xl | 大屏 | 1536px+ |

## 移动优先设计

移动优先(Mobile First)意味着先写移动端的样式作为默认规则，再用 `min-width` 媒体查询逐步增强大屏的样式。

```css
/* 移动优先：先写基础样式 */
.product-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
}

/* 平板：两列 */
@media (min-width: 768px) {
  .product-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

/* 桌面：三列 */
@media (min-width: 1024px) {
  .product-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}
```

**注意**：使用 `min-width` 而非 `max-width`。从最小屏幕开始写，逐步增强，这是移动优先的核心原则。

## Flexbox 与 Grid 响应式布局

```css
/* Flexbox 响应式卡片 */
.card-list {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
}

.card {
  flex: 1 1 100%; /* 手机：100% 宽度 */
}

@media (min-width: 768px) {
  .card {
    flex: 1 1 calc(50% - 16px); /* 平板：两列 */
  }
}

@media (min-width: 1024px) {
  .card {
    flex: 1 1 calc(33.333% - 16px); /* 桌面：三列 */
  }
}
```

Grid 配合 `auto-fill` 和 `minmax` 可以实现无媒体查询的响应式布局。

```css
/* 自适应列数，无需媒体查询 */
.auto-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
}
/* 每个格子最小 280px，空间不够自动换行 */
```

## rem / vw / vh 方案

### rem 适配方案

rem 相对于根元素 `<html>` 的 font-size。通过动态设置根字体大小，可以实现等比缩放。

```javascript
// 基准设计稿宽度 375px，1rem = 100px
function setRemUnit() {
  const docEl = document.documentElement;
  const width = docEl.clientWidth;
  // 限制最大宽度
  const rem = Math.min(width, 768) / 7.5;
  docEl.style.fontSize = rem + 'px';
}
setRemUnit();
window.addEventListener('resize', setRemUnit);
```

### vw/vh 视口单位

```css
.hero-banner {
  height: 100vh;          /* 全屏高度 */
  width: 100vw;           /* 全屏宽度 */
}

.half-section {
  width: 50vw;            /* 视口宽度的一半 */
  height: 50vh;           /* 视口高度的一半 */
}

/* 安全区域适配(iPhone 刘海屏) */
.page {
  padding: env(safe-area-inset-top) env(safe-area-inset-right)
    env(safe-area-inset-bottom) env(safe-area-inset-left);
}
```

## viewport meta 与设备像素比

```html
<!-- 标准 viewport 配置 -->
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
```

**关键属性说明**：
- `width=device-width`: 视口宽度等于设备屏幕宽度
- `initial-scale=1.0`: 初始缩放比例
- `maximum-scale=1.0`: 禁止用户缩放(移动端常用)

设备像素比(Device Pixel Ratio, DPR)表示物理像素与 CSS 像素的比值。Retina 屏幕 DPR=2 或 3，一个 CSS 像素由 2x2 或 3x3 个物理像素渲染。高 DPR 下需要提供更高分辨率的图片。

## 图片响应式

```html
<!-- srcset: 根据屏幕像素比选择图片 -->
<img
  src="photo-1x.jpg"
  srcset="photo-1x.jpg 1x, photo-2x.jpg 2x, photo-3x.jpg 3x"
  alt="Responsive photo"
/>

<!-- sizes + srcset: 根据视口宽度选择 -->
<img
  src="photo-small.jpg"
  srcset="photo-small.jpg 400w, photo-medium.jpg 800w, photo-large.jpg 1200w"
  sizes="(max-width: 768px) 100vw, 50vw"
  alt="Responsive image"
/>

<!-- picture: 艺术指导(不同屏幕用不同裁剪的图片) -->
<picture>
  <source media="(min-width: 1024px)" srcset="hero-desktop.jpg" />
  <source media="(min-width: 768px)" srcset="hero-tablet.jpg" />
  <img src="hero-mobile.jpg" alt="Hero banner" />
</picture>
```

## 触屏适配

```css
/* 消除 300ms 点击延迟 */
a, button, input {
  touch-action: manipulation;
}

/* 增大触屏可点击区域(最小 44x44px) */
.touch-target {
  min-width: 44px;
  min-height: 44px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

/* 禁用 iOS 长按菜单 */
.no-callout {
  -webkit-touch-callout: none;
  user-select: none;
}
```

## Tailwind 响应式断点

Tailwind 使用前缀表示断点，移动优先。

```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {/* 移动端 1 列，平板 2 列，桌面 3 列 */}
</div>

<h1 className="text-xl md:text-2xl lg:text-3xl">
  Responsive Title
</h1>

<nav className="hidden md:flex">
  {/* 移动端隐藏，平板以上显示 */}
</nav>
```

## 实际开发中的应用 / 常见问题

### 社区常见问题

**Q: rem 和 vw 方案怎么选？**

**A**: 新项目推荐 vw 方案，它不需要 JavaScript 计算，CSS 原生支持。rem 方案在需要兼容更老的浏览器或需要精确控制缩放比(如大屏展示)时仍有用。Tailwind 项目中使用其内置的 rem 单位即可，无需额外配置。

**Q: 响应式设计和自适应设计有什么区别？**

**A**: 响应式(Responsive)是一套代码适配所有设备(通过媒体查询变化布局)。自适应(Adaptive)通常指服务端根据 User-Agent 返回不同的模板/页面。前者是前端方案，后者是混合方案。

### 踩坑经验

iOS Safari 中，`100vh` 会包含底部导航栏的高度，导致内容被遮挡。使用 `dvh`(dynamic viewport height)或 JavaScript 动态计算可以解决。

```css
.page {
  min-height: 100vh;
  min-height: 100dvh; /* 动态视口高度 */
}
```

在 rem 方案下，第三方库可能写死了 px 值。需要在引入第三方库前确保根字体大小是合理的(通常 16px)，或者使用 PostCSS 的 `postcss-pxtorem` 将第三方样式也转换为 rem。在移动端开发中，`input` 聚焦时键盘弹出可能导致布局错乱，应优先使用 `position: fixed` 底部元素改为 `position: absolute` 或通过 `visualViewport` API 处理。
