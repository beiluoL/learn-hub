---
title: 前端调试技巧与 Chrome DevTools 深度使用
category: frontend
level: beginner
readMinutes: 14
tags: "调试, DevTools, Performance, SourceMap"
summary: 前端调试技巧与 Chrome DevTools 深度使用。
order: 26
prereq:
---

## Elements 面板

Elements 面板是调试 HTML 和 CSS 的首要工具。你可以实时编辑元素的样式、查看盒模型、添加伪类状态。

### 常用操作

- 点击元素后，右侧 Styles 面板显示所有生效的 CSS 规则，被覆盖的规则会显示为删除线
- 勾选 `:hov` 开关可以强制元素进入 hover/active/focus/visited 状态
- Computed 面板显示最终计算出的样式值，点击任意属性可以跳转到来源 CSS

### DOM 断点

在元素上右键 → Break on → Subtree modifications / Attribute modifications / Node removal。当对应 DOM 发生变化时，执行会暂停到 JavaScript 调用的那一行，极大方便追踪 DOM 操作来源。

## Console 面板进阶

Console 是开发者最熟悉的工具，但它有远超 `console.log` 的能力。

### 控制台快捷变量

- `$0`: 当前在 Elements 面板中选中的元素
- `$1` ~ `$4`: 最近选中的 4 个元素历史
- `$_`: 上一个表达式的返回值
- `$()`/`$$()`: 相当于 `document.querySelector()`/`document.querySelectorAll()`

### console.table

对于数组和对象数据，`console.table` 提供表格视图，远比 `console.log` 直观。

```javascript
const users = [
  { id: 1, name: 'Alice', role: 'admin' },
  { id: 2, name: 'Bob', role: 'editor' },
  { id: 3, name: 'Charlie', role: 'viewer' },
];
console.table(users);
```

### 其他实用技巧

- `console.group()` / `console.groupEnd()`: 分组日志，方便阅读
- `console.time('label')` / `console.timeEnd('label')`: 测量代码执行时间
- `console.count('label')`: 统计代码执行次数
- `console.assert(condition, message)`: 条件为假时输出错误

## Sources 面板与断点调试

Sources 面板是调试 JavaScript 的核心。以下断点类型覆盖不同调试场景。

### 断点类型

- **行断点**: 单击行号，执行到该行时暂停
- **条件断点**: 右键行号 → Add conditional breakpoint，输入条件表达式。只有条件为真时才暂停
- **DOM 断点**: 在 Elements 面板设置，DOM 变化时暂停
- **XHR/Fetch 断点**: 右侧 XHR Breakpoints，URL 包含指定字符串时暂停
- **事件监听断点**: 右侧 Event Listener Breakpoints，指定事件触发时暂停

### 调试辅助

- **Watch**: 添加自定义监视表达式，实时观察变量值
- **Call Stack**: 查看函数调用链，点击即可跳转到对应代码
- **Scope**: 查看当前作用域内的所有变量(Local/Closure/Global)
- **Blackboxing**: 将第三方脚本标记为忽略，调试时自动跳过

## Network 面板

Network 面板用于分析和优化网络请求。

### 核心功能

- **瀑布图(Waterfall)**: 每个请求的详细时间分解(DNS/连接/等待/下载)
- **请求过滤**: 按类型(XHR/JS/CSS/Img)、域名、状态码过滤
- **慢速模拟**: Throttling 下拉菜单选择 Slow 3G/Fast 3G，模拟移动网络
- **请求复制**: 右键请求 → Copy as fetch / cURL，快速复现请求
- **Big request rows**: 开启后显示更大信息密度

### 性能分析方向

关注首屏的请求链：被阻塞的请求、串行请求是否可以并行、不必要的重定向、可压缩但未压缩的资源。

## Performance 面板

Performance 面板用于分析和优化页面运行时性能。

### 录制与分析流程

1. 点击 Record 按钮(圆形)
2. 在页面上执行你想分析的操作
3. 停止录制

录制结果包括：

- **FPS 图表**: 绿色条越高越流畅，出现红色说明有掉帧
- **CPU 图表**: 可以判断是否存在密集计算
- **Network**: 网络请求时序
- **Main 线程火焰图**: 函数调用栈，定位 Long Task(>50ms 的黄色/红色块)
- **Summary 饼图**: 总时间的分布(脚本/渲染/绘制等)

### 关注指标

- Long Task: 超过 50ms 的任务标记为红色，每个 Long Task 都是阻塞交互的隐患
- FPS: 低于 60 表示滚动或动画不流畅
- JS Heap: 内存是否持续增长(内存泄漏)

## Application 面板

Application 面板管理客户端的存储数据。

- **Storage**: 查看总览并支持一键清除所有站点数据
- **Local Storage / Session Storage**: 查看和编辑键值对
- **Cookies**: 查看域名下的 Cookie，支持编辑
- **IndexedDB / Cache Storage**: 查看 Service Worker 缓存和 IndexedDB 数据

## SourceMap 原理

SourceMap 将编译/压缩后的代码映射回源码，是调试标准配置。

源文件末尾会包含 `//# sourceMappingURL=main.js.map`，DevTools 自动加载后即可在 Sources 面板看到原始源码。

SourceMap 格式的核心字段：
- `version`: 3
- `sources`: 源文件列表
- `mappings`: 基于 VLQ 编码的位置映射
- `sourcesContent`: 可选，内嵌的源文件内容

## 实际开发中的应用 / 常见问题

### 社区常见问题

**Q: 生产环境应该暴露 SourceMap 吗？**

**A**: 不建议。SourceMap 会泄露源码结构。如果需要监控线上错误，可以将 SourceMap 上传到 Sentry 等监控平台，而不是部署到服务器。使用 `hidden-source-map` 类型，只生成 map 文件但不在 js 中引用。

**Q: Chrome DevTools 和 React DevTools 如何配合使用？**

**A**: React DevTools 的 Components 面板让你查看组件树和 props/state，Profiler 面板记录组件渲染性能。先在 React DevTools Profiler 中定位渲染过度的组件，再到 Chrome Performance 面板深入分析底层调用。

### 踩坑经验

条件断点的表达式如果太复杂会影响调试性能，推荐使用简单比较而非函数调用。在 Source 面板中点行号时按住 Ctrl/Cmd 可以添加 Logpoint(不暂停仅打印)，对于不能暂停的实时场景非常有用。

Sources 面板的 Overrides 功能可以将网络资源映射到本地文件，允许你修改线上代码进行实时调试。配合 Network 面板的 Response Override，可以模拟各种后端响应数据。
