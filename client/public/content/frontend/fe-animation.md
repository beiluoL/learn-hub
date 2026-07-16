---
title: 前端动画与动效设计
category: frontend
level: beginner
readMinutes: 14
tags: "动画, CSS动画, Framer Motion, 动效"
summary: 前端动画与动效设计。
order: 34
prereq:
---

## CSS Transition

Transition 是最简单的动画方式，当元素从一种状态变为另一种状态时，平滑过渡。

```css
/* 基础过渡 */
.button {
  background: #1890ff;
  padding: 10px 20px;
  border: none;
  color: white;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.3s ease, transform 0.2s ease;
}

.button:hover {
  background: #096dd9;
  transform: translateY(-2px);
}

.button:active {
  transform: translateY(0);
}

/* 列表入场动画 */
.list-item {
  opacity: 0;
  transform: translateY(20px);
  transition: opacity 0.4s ease, transform 0.4s ease;
}

.list-item.visible {
  opacity: 1;
  transform: translateY(0);
}

/* 每个元素延迟不同，形成瀑布效果 */
.list-item:nth-child(1) { transition-delay: 0s; }
.list-item:nth-child(2) { transition-delay: 0.1s; }
.list-item:nth-child(3) { transition-delay: 0.2s; }
```

**注意**：Transition 只能做两种状态之间的过渡，对于复杂的多阶段动画，需要 `@keyframes`。

## CSS Keyframes 动画

```css
/* 基本关键帧 */
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: scale(0.9);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
}

@keyframes slideInFromLeft {
  from {
    transform: translateX(-100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

.modal-overlay {
  animation: fadeIn 0.3s ease;
}

.loading-dot {
  animation: pulse 1.5s ease-in-out infinite;
}

.drawer {
  animation: slideInFromLeft 0.35s ease-out;
}
```

### 贝塞尔曲线

`ease`、`ease-in`、`ease-out` 和 `ease-in-out` 是预设的贝塞尔曲线。自定义曲线可以创造更自然的动效。

```css
/* 自定义贝塞尔曲线 */
.bouncy {
  transition: transform 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55);
}

.bouncy:hover {
  transform: scale(1.1);
}

/* 常用自定义曲线速查 */
/* ease-in-out 平滑版 */  .smooth { transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1); }
/* 回弹效果 */            .spring { transition-timing-function: cubic-bezier(0.68, -0.55, 0.27, 1.55); }
/* 减速 */               .decelerate { transition-timing-function: cubic-bezier(0, 0, 0.2, 1); }
/* 加速 */               .accelerate { transition-timing-function: cubic-bezier(0.4, 0, 1, 1); }
```

## 动画性能优化

动画性能的核心是避免触发浏览器的 reflow 和 repaint。

### 只使用 transform 和 opacity

这两属性由 GPU 合成器处理，不会触发重排。

```css
/* 高性能 */
.element {
  transform: translateX(100px);   /* GPU 合成 */
  opacity: 0.5;                   /* GPU 合成 */
}

/* 低性能(触发重排) */
.element {
  left: 100px;     /* 改变 layout → reflow */
  width: 200px;    /* 改变 layout → reflow */
  color: red;      /* 改变 paint → repaint */
}
```

### will-change

提前告知浏览器哪些属性可能变化，触发 GPU 预优化。

```css
.slide-panel {
  will-change: transform;
}
/* 注意：仅在动画开始前设置，动画结束后移除 */
/* 过度使用 will-change 会消耗 GPU 内存 */
```

### 使用 requestAnimationFrame

```javascript
// 对，使用 rAF 驱动动画
function animate() {
  element.style.transform = `translateX(${position}px)`;
  position += 1;
  if (position < 300) {
    requestAnimationFrame(animate);
  }
}
requestAnimationFrame(animate);

// 错：使用 setInterval 做动画
// setInterval(animate, 16); // 不精确，掉帧
```

## Framer Motion

Framer Motion 是 React 生态最流行的动画库，提供声明式 API。

```tsx
import { motion, AnimatePresence } from 'framer-motion';

// 基础动画
function AnimatedCard() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.05, boxShadow: '0 10px 30px rgba(0,0,0,0.15)' }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className="p-6 bg-white rounded-lg shadow cursor-pointer"
    >
      <h3>Animated Card</h3>
    </motion.div>
  );
}

// 退出动画(配合 AnimatePresence)
function NotificationList({ items }: { items: { id: string; text: string }[] }) {
  return (
    <div>
      <AnimatePresence>
        {items.map((item) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-blue-50 p-3 rounded mb-2 overflow-hidden"
          >
            {item.text}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

// 交变动画(inView)
function FadeInSection({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.6 }}
    >
      {children}
    </motion.div>
  );
}
```

## 滚动驱动动画

CSS 原生支持滚动驱动动画(Chrome 115+)。

```css
@keyframes reveal {
  from { opacity: 0; transform: translateY(50px); }
  to { opacity: 1; transform: translateY(0); }
}

.scroll-reveal {
  animation: reveal linear;
  animation-timeline: view();
  animation-range: entry 0% cover 40%;
}
```

JavaScript 实现滚动驱动动画(兼容性更好)：

```javascript
const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
  },
  { threshold: 0.1 }
);

document.querySelectorAll('.reveal').forEach((el) => observer.observe(el));
```

## 动效设计原则

好的动效不是炫技，而是服务于功能性目的。

1. **功能性**: 动效应该传递信息(如页面跳转方向、操作反馈)
2. **适度**: 避免过度动画，简洁的过渡优于复杂的动画
3. **一致性**: 全局动画时长和缓动函数保持统一(如进入 300ms、退出 200ms)
4. **遵循物理规律**: 使用 spring 动画模拟真实世界的弹性
5. **无障碍**: 提供 `prefers-reduced-motion` 的替代方案

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

## 实际开发中的应用 / 常见问题

### 社区常见问题

**Q: Framer Motion 会影响性能吗？**

**A**: Framer Motion 默认使用 `transform` 和 `opacity` 做动画，性能与纯 CSS 动画相当。但对大量元素同时做动画时(如长列表)，无论是 CSS 还是 Framer Motion 都可能影响帧率，需要采取措施(如虚拟列表 + 减少动画元素)。

**Q: CSS 动画和 Framer Motion 怎么选？**

**A**: 简单的过渡(hover 效果、显示/隐藏)用 CSS。复杂的状态动画(列表出入场、手势拖拽、编排)用 Framer Motion。两者可以共存，不需要二选一。

### 踩坑经验

`will-change` 不应该作为全局样式或长期存在的属性。它告诉浏览器预分配 GPU 资源，长期持有会浪费显存。正确用法是在即将发生动画时设置，动画结束后移除。

```javascript
element.addEventListener('mouseenter', () => {
  element.style.willChange = 'transform';
});
element.addEventListener('animationend', () => {
  element.style.willChange = 'auto';
});
```

iOS Safari 中 `overflow: hidden` 容器内的 `position: fixed` 元素不会固定。这是因为 iOS Safari 将 `overflow` 创建了一个新的滚动上下文。解决方案是将 fixed 元素移到 overflow 容器外部。
