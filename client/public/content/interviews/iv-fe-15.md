---
question: 从输入 URL 到页面渲染完成，浏览器做了哪些事？
category: frontend
difficulty: middle
tags: "浏览器, 渲染流程, DNS, TCP, DOM, 重排重绘"
order: 67
---

**核心结论**：从输入 URL 到页面渲染完成，浏览器经历了一条复杂而精密的流水线：**DNS 解析（域名 → IP）→ TCP 三次握手建立连接 → (HTTPS) TLS 握手 → 发送 HTTP 请求 → 服务器响应 → 解析 HTML 构建 DOM 树 → 解析 CSS 构建 CSSOM 树 → 合成 Render 树 → 布局 Layout → 绘制 Paint → 合成 Composite**。整个过程涉及网络层、渲染引擎和 GPU 三大部分，理解这一流程是前端性能优化的理论基础。

## 完整流程拆解

### 第一阶段：网络请求（~100-200ms）

**1. DNS 解析（域名 → IP 地址）**

```
输入 www.example.com → DNS 解析 → 93.184.216.34
```

DNS 解析有层级缓存机制：

```
浏览器 DNS 缓存（1 分钟）
    ↓ 未命中
操作系统 hosts 文件
    ↓ 未命中
路由器 DNS 缓存
    ↓ 未命中
ISP（互联网服务提供商）DNS 服务器
    ↓ 未命中
根域名服务器 → 顶级域服务器 → 权威 DNS 服务器（递归/迭代查询）
```

**DNS 预解析优化**：

```html
<!-- 提前解析即将访问的域名 -->
<link rel="dns-prefetch" href="//api.example.com">
```

**2. TCP 三次握手**

```
客户端                        服务器
   │─── SYN (seq=x) ───────→  │  第一次握手：客户端请求建立连接
   │←── SYN (seq=y) + ACK(x+1)─│  第二次握手：服务器确认并发送各自 SYN
   │─── ACK(y+1) ───────────→ │  第三次握手：客户端确认，连接建立

连接建立后 → 数据传输
```

**3. TLS 握手（HTTPS 访问时）**

HTTPS 在 TCP 之上还需要 TLS 握手：

```
1. 客户端 → ClientHello（支持的 TLS 版本、加密套件列表、随机数1）
2. 服务器 → ServerHello（选择的加密套件、随机数2）+ 服务器证书
3. 客户端验证证书、生成 Pre-Master Secret（用服务器公钥加密）
4. 双方使用随机数1+2+Pre-Master Secret 生成对称加密的 Session Key
5. 后续通信使用 Session Key 对称加密
```

总计 TCP 握手 1~2 个 RTT，TLS 1.2 握手 2 个 RTT，TLS 1.3 优化为 1 个 RTT。

**4. 发送 HTTP 请求与接收响应**

```http
GET /index.html HTTP/1.1
Host: www.example.com
User-Agent: Mozilla/5.0 ...
Accept: text/html,application/xhtml+xml
Accept-Encoding: gzip, deflate, br
Connection: keep-alive
```

服务器响应：

```http
HTTP/1.1 200 OK
Content-Type: text/html; charset=UTF-8
Content-Encoding: gzip
Cache-Control: max-age=3600
Content-Length: 15234

<!DOCTYPE html>
<html>...</html>
```

### 第二阶段：HTML 解析与 DOM 构建

浏览器拿到 HTML 字节流后进入解析阶段：

```
字节 (Bytes) → 字符 (Characters) → 令牌 (Tokens) → 节点 (Nodes) → DOM 树 (DOM Tree)
```

**并发加载的坑：script 标签阻塞**

```
- <script src="app.js">       → 阻塞 HTML 解析，下载+执行完后才继续
- <script src="app.js" async> → 不阻塞 HTML 解析，下载完后立即执行（打乱执行顺序）
- <script src="app.js" defer> → 不阻塞 HTML 解析，等 DOM 解析完后按顺序执行
```

```html
<!-- 实践对比 -->
<!-- 传统写法：阻塞渲染，白屏时间长 -->
<script src="jquery.js"></script>
<script src="app.js"></script>

<!-- 现代写法：不阻塞 DOM 构建，批量在 DOMContentLoaded 前执行 -->
<script src="vendor.js" defer></script>
<script src="app.js" defer></script>
```

### 第三阶段：CSSOM 构建

CSS 解析与 DOM 构建是**并行**进行的：

```
CSS 字节 → 字符 → 令牌 → 节点 → CSSOM 树
```

关键问题：**CSS 会阻塞渲染**。浏览器必须同时拥有 DOM 和 CSSOM 才能合成 Render Tree，因此在 CSSOM 构建完成前，页面不会开始渲染。这也是为什么：

```html
<!-- 推荐：将关键 CSS 内联到 <head> 中 -->
<style>
  /* 关键路径 CSS，消除阻塞 */
  .header { background: #333; }
</style>

<!-- 非关键 CSS 异步加载 -->
<link rel="preload" href="styles.css" as="style" onload="this.rel='stylesheet'">
```

### 第四阶段：构建 Render Tree、布局与绘制

**步骤 1：Render Tree 构建**

```
DOM Tree + CSSOM Tree → Render Tree
```

Render Tree 与 DOM Tree 的区别：
- `display: none` 的节点不在 Render Tree 中（`visibility: hidden` 还在）
- `head` 标签不在 Render Tree 中
- 伪元素（`::before`、`::after`）会被添加到 Render Tree 中

**步骤 2：Layout（重排/回流）**

计算每个元素的精确位置和大小：

```javascript
// 触发 Layout 的操作
element.offsetWidth         // 读取几何属性 → 强制同步 Layout
element.style.width = '100px'  // 修改几何属性 → 触发重排
window.getComputedStyle(el)    // 获取计算样式 → 可能触发重排
```

**步骤 3：Paint（重绘）**

将 Render Tree 的每个节点转换为屏幕上的实际像素。Paint 完成后形成多个**图层**。

**步骤 4：Composite（合成）**

将各个图层按正确的顺序合成在一起，生成最终屏幕显示：

```
图层 1 (背景)  ─┐
图层 2 (文字)  ─┤→ Compositor Thread 合成 → 屏幕显示
图层 3 (按钮)  ─┘
```

现代浏览器利用 GPU 进行合成加速，`transform` 和 `opacity` 只触发 `Composite` 不触发 `Layout` 和 `Paint`，因此在动画中性能最优：

```css
/* 推荐：性能最优的动画方式 */
.animate-element {
    /* 使用 transform: translate 而非 left/top */
    transform: translateX(100px);   /* 仅 Composite → 流畅 60fps */
    /* 不要这样做： */
    /* left: 100px; */             /* 触发 Layout → 卡顿 */
}
```

## 关键路径优化（Critical Rendering Path）

| 优化策略               | 具体操作                                     | 原理                       |
|-----------------------|---------------------------------------------|---------------------------|
| 减少关键资源数量       | 合并 CSS/JS 文件，删除未使用的代码              | 减少需要下载的资源次数        |
| 减少关键字节数         | 压缩(Minify)、Gzip/Brotli 压缩、图片压缩       | 减少传输体积                |
| 缩短关键路径长度       | 内联关键 CSS，异步加载非关键资源                | 减少网络往返次数            |
| 利用缓存               | 设置强缓存 (Cache-Control)、CDN 加速           | 减少重复下载               |
| 避免 render-blocking   | script 用 defer/async，CSS 分屏加载           | 不阻塞 DOM 解析            |

## 面试官追问

**1. DOMContentLoaded 与 load 事件的区别？**

- `DOMContentLoaded`：HTML 解析完成，DOM 树构建完毕（不等待 CSS、图片、iframe 等外部资源加载）。此时 `defer` 脚本已执行完毕。
- `load`：页面上所有资源（包括图片、CSS、iframe）全部加载完成后的触发。
- 时间顺序：`DOMContentLoaded` → `load`。性能指标 FCP（First Contentful Paint）通常落在这两者之间。

**2. 什么是 reflow（重排）和 repaint（重绘），如何避免？**

**重排（Reflow/Layout）**：元素的几何属性（宽高、位置、边距）发生变化，浏览器需要重新计算布局。重排的代价很高，因为它会**级联影响**所有子元素和相邻元素。

**重绘（Repaint）**：元素的视觉外观改变（颜色、背景、阴影等）但不影响布局。重绘的代价较低。

**避免策略**：

```javascript
// 不好的写法：多次触发 Layout（读写交替）
element.style.width = '100px';
let h = element.offsetHeight;  // 强制 Layout
element.style.height = '200px';
let w = element.offsetWidth;   // 再次强制 Layout

// 好的写法：批量读、批量写
let h = element.offsetHeight;
let w = element.offsetWidth;
element.style.width = '100px';
element.style.height = '200px';

// 使用 requestAnimationFrame 批处理
requestAnimationFrame(() => {
    element.style.width = '100px';
    element.style.height = '200px';
});

// 将复杂 DOM 操作离线处理
let fragment = document.createDocumentFragment();
// ... 操作 fragment
document.body.appendChild(fragment);

// 动画使用 transform + opacity，触发 Composite 而非 Layout
```

**3. 浏览器的渲染进程包含哪些线程？**

浏览器渲染进程（Renderer Process）包含以下关键线程：
- **主线程（Main Thread）**：执行 JavaScript、样式计算、布局、绘制
- **合成线程（Compositor Thread）**：负责图层合成，与主线程并行
- **光栅化线程池（Raster Thread Pool）**：将绘制命令转为位图
- **IO 线程**：处理网络请求等 IO 操作

其中合成线程不与主线程竞争，这是 `transform` 动画流畅的根本原因。
