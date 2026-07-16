---
title: 现代 CSS 工程化方案：Tailwind/CSS Modules/PostCSS 对比上手
category: frontend
level: intermediate
readMinutes: 18
tags: "CSS, Tailwind, CSS Modules, PostCSS"
summary: 现代 CSS 工程化方案：Tailwind/CSS Modules/PostCSS 对比上手。
order: 20
prereq: frontend/fe-js-core
---

## 传统 CSS 的痛点

在传统 CSS 开发中，随着项目规模增长，样式管理会逐渐失控。全局作用域是所有问题的根源：一个组件不小心定义的 `.button` 类可能覆盖另一个组件的同名类；修改一处样式需要担心对全局的副作用。

**具体痛点**：

- **全局污染**: 所有 class 都是全局有效，容易冲突
- **依赖管理混乱**: 无法明确知道某个元素依赖哪些样式
- **死代码难以清除**: 删除了组件但不敢删除对应 CSS
- **选择器优先级地狱**: 嵌套层级深了之后难以覆盖

## CSS Modules: 局部作用域

CSS Modules 通过构建工具将类名自动转换为唯一标识，从根本上解决全局污染问题。在 Vite 中，CSS Modules 开箱即用。

### 基本使用

文件命名约定为 `*.module.css`，导入后每个类名都会被映射为唯一字符串。

```css
/* Button.module.css */
.button {
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
}

.primary {
  background: #1890ff;
  color: white;
}

.danger {
  background: #ff4d4f;
  color: white;
}
```

```tsx
import styles from './Button.module.css';

function Button({ type }: { type: 'primary' | 'danger' }) {
  return (
    <button className={`${styles.button} ${styles[type]}`}>
      Click me
    </button>
  );
}
```

### composes: 样式复用

CSS Modules 提供了 `composes` 关键字，可以让一个类继承另一个类的样式，且不会引入全局污染。

```css
/* Card.module.css */
.base {
  border: 1px solid #e8e8e8;
  border-radius: 8px;
  padding: 16px;
}

.elevated {
  composes: base;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.clickable {
  composes: base;
  cursor: pointer;
  transition: box-shadow 0.2s;
}
```

## Tailwind CSS: 原子化 CSS

Tailwind 采用完全不同的思路：不再写语义化类名，而是直接用大量原子类构建界面。每个类只做一件事，组合起来就是完整的样式。

### 核心理念

原子化 CSS 的优势在于样式与组件物理内聚，修改时不需要跨文件查找；同时构建时会自动 Purge 未使用的样式，产物体积极小。

```tsx
function UserCard({ name, avatar }: { name: string; avatar: string }) {
  return (
    <div className="flex items-center gap-3 p-4 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow">
      <img src={avatar} className="w-12 h-12 rounded-full object-cover" />
      <div>
        <p className="text-sm font-medium text-gray-900">{name}</p>
        <p className="text-xs text-gray-500">Online</p>
      </div>
    </div>
  );
}
```

### 定制配置与 JIT 编译

Tailwind 的 `tailwind.config.js` 提供了强大的定制能力，可以扩展颜色、间距、字体等设计令牌。JIT (Just-in-Time) 模式按需生成样式，开发体验极快。

```js
// tailwind.config.js
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eff6ff',
          500: '#3b82f6',
          700: '#1d4ed8',
        },
      },
      spacing: {
        '128': '32rem',
      },
    },
  },
  plugins: [],
};
```

## PostCSS 生态

PostCSS 本身是一个 CSS 处理平台，它通过插件机制提供了无限的扩展能力。前端构建中常见的 PostCSS 工具链如下：

- **autoprefixer**: 自动添加浏览器前缀，不需要手动写 `-webkit-` 等
- **postcss-preset-env**: 将未来的 CSS 语法转换为当前浏览器可识别的代码
- **postcss-nested**: 支持 Sass/Less 风格的嵌套写法
- **cssnano**: 生产环境 CSS 压缩

```js
// postcss.config.js
module.exports = {
  plugins: {
    'postcss-preset-env': {
      stage: 3,
      features: { 'nesting-rules': true },
    },
    'autoprefixer': {},
    'cssnano': process.env.NODE_ENV === 'production' ? {} : false,
  },
};
```

## CSS-in-JS: styled-components

对于 React 生态，CSS-in-JS 方案让样式完全融入 JavaScript 运行时，基于 props 动态生成样式。

```tsx
import styled from 'styled-components';

const Button = styled.button<{ $variant: 'primary' | 'danger' }>`
  padding: 8px 16px;
  border-radius: 4px;
  border: none;
  cursor: pointer;
  background: ${(props) =>
    props.$variant === 'primary' ? '#1890ff' : '#ff4d4f'};
  color: white;

  &:hover {
    opacity: 0.9;
  }
`;

function App() {
  return <Button $variant="primary">Submit</Button>;
}
```

**注意**：CSS-in-JS 在运行时计算样式，对性能敏感场景需要权衡。RSC (React Server Components) 不兼容运行时 CSS-in-JS。

## 方案选型对比

| 方案 | 作用域 | 学习成本 | 运行时开销 | 适用场景 |
|------|--------|----------|-----------|---------|
| CSS Modules | 局部 | 低 | 无 | 中小项目、团队习惯类名 |
| Tailwind CSS | 全局(原子) | 中 | 无(JIT) | 中大型项目、快速迭代 |
| PostCSS | 全局 | 中 | 构建时 | 需要预处理功能 |
| styled-components | 局部 | 低 | 有(运行时) | React SPA |
| Vanilla Extract | 局部 | 中 | 无(零运行时) | 需要 TypeScript + 零运行时 |

## 实际开发中的应用 / 常见问题

### 社区常见问题

**Q: Tailwind 写出来的 class 太长了，代码可读性差怎么办？**

**A**: 可以封装为组件，或者使用 `@apply` 指令将常用组合抽取为 CSS 类。但优先考虑组件化而非 `@apply`，保持原子化的优势。

**Q: CSS Modules 和 Tailwind 可以共存吗？**

**A**: 可以。一些项目使用 CSS Modules 写组件的复杂布局，用 Tailwind 快速写间距、颜色等简单样式。但混用会增加团队理解成本。

**Q: 如何迁移现有 BEM 项目到 Tailwind？**

**A**: 不需要一次性全部迁移。新组件用 Tailwind 写，旧组件保持 BEM，逐步替换。关键是在团队内达成共识，确定迁移标准。在使用 PostCSS 的项目中，两个方案可以用构建配置并行运行。

### 踩坑经验

`composes` 在使用时如果引用了来自其他文件的类，需要确保构建工具配置了对应的路径解析。在 Vite + CSS Modules 中，跨文件 composes 默认支持；Webpack 需要 `css-loader` 的 `modules.mode` 设置为 `local`。

Tailwind 的生产构建依赖 `content` 配置正确扫描模板文件。如果动态拼接类名（如 `bg-${color}-500`），JIT 无法识别，需要在 `safelist` 中显式声明或用完整的类名字符串。
