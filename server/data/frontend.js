// 前端学习文章内容
export const frontendArticles = [
  {
    id: 'fe-js-core',
    title: 'JavaScript 核心：闭包、原型与 this',
    level: 'beginner',
    readMinutes: 14,
    tags: ['JavaScript', '闭包', '原型链', 'this'],
    summary: '夯实 JS 三大难点，理解语言本质而非死记语法。',
    content: `
<h2>一、闭包（Closure）</h2>
<p>函数与其词法环境的组合。内层函数可访问外层作用域变量，即使外层已执行完毕：</p>
<pre><code>function outer() {
  let count = 0;
  return () =&gt; ++count;
}
const fn = outer();
fn(); // 1</code></pre>
<p>典型用途：数据私有化、函数工厂、防抖节流。</p>

<h2>二、原型与原型链</h2>
<p>每个对象有隐藏的 <code>[[Prototype]]</code>（<code>__proto__</code>），向上查找属性形成<b>原型链</b>。构造函数通过 <code>prototype</code> 共享方法：</p>
<pre><code>function Person(name) { this.name = name; }
Person.prototype.say = function () { return this.name; };
const p = new Person("Tom");
p.say(); // 沿原型链找到 say</code></pre>

<h2>三、this 的绑定规则</h2>
<p>优先级：<b>new</b> &gt; 显式绑定(call/apply/bind) &gt; 隐式绑定(对象调用) &gt; 默认(严格模式 undefined)。箭头函数没有自己的 this，继承外层。</p>
<pre><code>const obj = {
  name: "A",
  fn() { return this.name; },     // 隐式绑定 → "A"
  arrow: () =&gt; this.name          // 箭头 → 外层 this
};</code></pre>
`,
  },
  {
    id: 'fe-dom',
    title: 'DOM、事件与渲染机制',
    level: 'beginner',
    readMinutes: 13,
    tags: ['DOM', '事件', '渲染', '回流重绘'],
    summary: '理解浏览器渲染流程与事件模型，写出流畅交互。',
    content: `
<h2>一、DOM 操作</h2>
<pre><code>const el = document.querySelector("#app");
el.textContent = "hi";
el.addEventListener("click", handler);</code></pre>
<p>批量操作优先用 <code>DocumentFragment</code> 或先 <code>display:none</code> 再改，减少回流。</p>

<h2>二、事件流与委托</h2>
<p>事件三阶段：捕获 → 目标 → 冒泡。利用冒泡做<b>事件委托</b>，减少监听器数量：</p>
<pre><code>list.addEventListener("click", (e) =&gt; {
  const li = e.target.closest("li");
  if (li) handle(li);
});</code></pre>

<h2>三、浏览器渲染流水线</h2>
<p>JS → 样式计算 → 布局(Layout/回流) → 绘制(Paint) → 合成(Composite)。</p>
<ul>
  <li><b>回流</b>：几何属性变化（宽高、位置），代价大</li>
  <li><b>重绘</b>：颜色等外观变化，不涉及布局</li>
  <li>优先用 <code>transform</code>/<code>opacity</code>（仅合成层，GPU 加速）</li>
</ul>
`,
  },
  {
    id: 'fe-react',
    title: 'React 核心：组件、Hooks 与状态',
    level: 'intermediate',
    readMinutes: 18,
    tags: ['React', 'Hooks', '状态管理', '组件'],
    summary: '掌握函数组件与 Hooks 心智模型，理解渲染与副作用。',
    content: `
<h2>一、组件与 JSX</h2>
<p>组件即返回 UI 的函数；JSX 是 <code>React.createElement</code> 的语法糖：</p>
<pre><code>function Greet({ name }) {
  return &lt;h1&gt;Hello, {name}&lt;/h1&gt;;
}</code></pre>

<h2>二、Hooks 三剑客</h2>
<pre><code>const [count, setCount] = useState(0);     // 状态
useEffect(() =&gt; {                          // 副作用
  const id = setInterval(() =&gt; setCount(c =&gt; c+1), 1000);
  return () =&gt; clearInterval(id);          // 清理函数
}, []);                                    // 依赖为空 → 仅挂载时
const ref = useRef(null);                  // 跨渲染保存可变值</code></pre>
<ul>
  <li><code>useState</code>：状态更新是<b>不可变</b>的，setState 触发重渲染</li>
  <li><code>useEffect</code>：依赖变化才执行；返回清理函数</li>
  <li>状态提升 / Context 解决跨组件共享</li>
</ul>

<h2>三、渲染优化</h2>
<ul>
  <li><code>React.memo</code> 包裹组件避免无谓重渲染</li>
  <li><code>useMemo</code> 缓存计算，<code>useCallback</code> 缓存函数</li>
  <li>列表加稳定 <code>key</code>（勿用 index 作 key 的常规做法）</li>
</ul>
`,
  },
  {
    id: 'fe-engineering',
    title: '前端工程化：构建与模块化',
    level: 'intermediate',
    readMinutes: 16,
    tags: ['Vite', 'Webpack', '模块化', '工程化'],
    summary: '理解 ESM、打包器与现代化构建工具链。',
    content: `
<h2>一、模块化演进</h2>
<p>从 IIFE → CommonJS（Node，同步） → AMD → <b>ES Module</b>（浏览器原生 <code>import/export</code>）。现代前端统一用 ESM。</p>
<pre><code>// math.js
export const add = (a, b) =&gt; a + b;
// main.js
import { add } from "./math.js";</code></pre>

<h2>二、打包器做什么</h2>
<ul>
  <li>依赖图解析、Tree Shaking（剔除未用代码）</li>
  <li>代码分割（Code Splitting）、懒加载</li>
  <li>转译（Babel/TS）、压缩、HMR 热更新</li>
</ul>

<h2>三、Vite：下一代构建工具</h2>
<p>开发期利用浏览器原生 ESM + esbuild 极速启动，无需打包；生产期用 Rollup 打包：</p>
<pre><code>npm create vite@latest
npm run dev      # 秒级启动
npm run build    # Rollup 产物</code></pre>
<p>对比 Webpack（成熟、配置重、生态大）与 Vite（快、约定优于配置），新项目优先 Vite。</p>
`,
  },
  {
    id: 'fe-perf',
    title: '前端性能优化实战',
    level: 'advanced',
    readMinutes: 17,
    tags: ['性能', 'LCP', '懒加载', '缓存'],
    summary: '从加载、渲染到运行时，系统性提升页面性能。',
    content: `
<h2>一、加载性能</h2>
<ul>
  <li>代码分割 + 路由级懒加载（<code>React.lazy</code> / 动态 <code>import()</code>）</li>
  <li>图片用 <code>webp</code>、<code>loading="lazy"</code>、响应式 <code>srcset</code></li>
  <li>资源走 CDN + HTTP 缓存（强缓存 Cache-Control，协商缓存 ETag）</li>
</ul>

<h2>二、Core Web Vitals</h2>
<table>
  <tr><th>指标</th><th>含义</th><th>目标</th></tr>
  <tr><td>LCP</td><td>最大内容绘制</td><td>&lt; 2.5s</td></tr>
  <tr><td>INP</td><td>交互到响应</td><td>&lt; 200ms</td></tr>
  <tr><td>CLS</td><td>累积布局偏移</td><td>&lt; 0.1</td></tr>
</table>

<h2>三、运行时优化</h2>
<ul>
  <li>防抖（debounce）/ 节流（throttle）控制高频事件</li>
  <li>虚拟列表渲染长列表（只渲染可视区）</li>
  <li>Web Worker 处理重计算，避免阻塞主线程</li>
  <li>合理使用 <code>requestAnimationFrame</code></li>
</ul>
<pre><code>function debounce(fn, wait) {
  let t;
  return (...a) =&gt; { clearTimeout(t); t = setTimeout(() =&gt; fn(...a), wait); };
}</code></pre>
`,
  },
];
