// 近期面试题数据（含答案要点）
export const interviews = [
  // ---------- Java ----------
  {
    id: 'iv-java-1',
    category: 'java',
    difficulty: 'middle',
    question: 'HashMap 和 ConcurrentHashMap 的区别？ConcurrentHashMap 如何保证线程安全？',
    tags: ['集合', '并发', 'HashMap'],
    answer: `
<p><b>区别：</b>HashMap 非线程安全，多线程下扩容可能死循环/数据丢失；ConcurrentHashMap 线程安全且高并发。</p>
<p><b>实现（JDK 1.8）：</b>抛弃分段锁，改为 <b>CAS + synchronized 锁单个桶（头节点）</b>。</p>
<ul>
  <li>读操作基本无锁（volatile 保证可见性）</li>
  <li>写操作只对当前桶加细粒度锁，其他桶可并发</li>
  <li>链表转红黑树阈值仍为 8</li>
</ul>
<p>对比 Hashtable（方法级 synchronized，整体一把锁，并发差）和 Collections.synchronizedMap（同理）。</p>`,
  },
  {
    id: 'iv-java-2',
    category: 'java',
    difficulty: 'hard',
    question: 'Java 中 synchronized 和 ReentrantLock 的区别？锁升级过程是怎样的？',
    tags: ['并发', '锁', 'JVM'],
    answer: `
<p><b>synchronized：</b>JVM 内置，自动加解锁，可重入；1.6 后做了锁升级优化。</p>
<p><b>ReentrantLock：</b>API 层面锁，需手动 unlock（放在 finally），支持可中断、公平锁、多条件 Condition。</p>
<p><b>锁升级（synchronized）：</b>无锁 → 偏向锁（同一线程重复进入）→ 轻量级锁（CAS 自旋）→ 重量级锁（操作系统互斥，线程阻塞）。升级后不可降级。</p>`,
  },
  {
    id: 'iv-java-3',
    category: 'java',
    difficulty: 'middle',
    question: 'JVM 内存结构是怎样的？哪些区域会发生 OOM？',
    tags: ['JVM', '内存', 'OOM'],
    answer: `
<p><b>运行时数据区：</b>堆、方法区(元空间)、虚拟机栈、本地方法栈、程序计数器。</p>
<ul>
  <li>堆 OOM：对象过多且无法回收（内存泄漏/堆太小）</li>
  <li>元空间 OOM：加载的类过多（如动态代理、热部署）</li>
  <li>虚拟机栈 OOM/StackOverflow：递归过深（StackOverflowError）、线程数过多（栈内存耗尽）</li>
  <li>程序计数器不会发生 OOM</li>
</ul>`,
  },
  // ---------- Python ----------
  {
    id: 'iv-py-1',
    category: 'python',
    difficulty: 'middle',
    question: 'Python 中 list 和 tuple 的区别？什么场景用 tuple？',
    tags: ['数据类型', '性能'],
    answer: `
<p><b>区别：</b>list 可变（可增删改），tuple 不可变（创建后不能改）。</p>
<p><b>用 tuple 的场景：</b></p>
<ul>
  <li>数据不应被修改（如配置、坐标），不可变更安全</li>
  <li>作为 dict 的 key（tuple 可哈希，list 不行）</li>
  <li>性能略好、内存更小（结构更简单）</li>
  <li>函数返回多个值本质就是返回 tuple</li>
</ul>`,
  },
  {
    id: 'iv-py-2',
    category: 'python',
    difficulty: 'hard',
    question: '解释 GIL（全局解释器锁）是什么？它对多线程有什么影响？如何绕过？',
    tags: ['GIL', '并发', '多线程'],
    answer: `
<p><b>GIL：</b>CPython 的全局解释器锁，同一时刻只有一个线程执行 Python 字节码。</p>
<p><b>影响：</b>多线程无法利用多核做 CPU 并行；<b>IO 密集型</b>任务仍可通过多线程提升（等待 IO 时释放 GIL），但<b>CPU 密集型</b>多线程反而可能因切换变慢。</p>
<p><b>绕过方案：</b></p>
<ul>
  <li>CPU 密集 → 用 <b>多进程</b>（multiprocessing，各自独立 GIL）</li>
  <li>IO 密集 → 用 <b>asyncio</b> 协程</li>
  <li>用释放 GIL 的 C 扩展（如 NumPy 底层计算）</li>
  <li>换无 GIL 实现（如 PyPy 部分场景、Python 3.13 实验性 nogil）</li>
</ul>`,
  },
  {
    id: 'iv-py-3',
    category: 'python',
    difficulty: 'middle',
    question: '什么是装饰器？请写出一个带参数的装饰器并说明执行顺序。',
    tags: ['装饰器', '闭包'],
    answer: `
<p><b>装饰器：</b>接收函数、返回新函数的高阶函数，用于在不改原函数代码的前提下添加功能（日志、计时、鉴权）。</p>
<p><b>带参装饰器（三层嵌套）：</b></p>
<pre><code>def repeat(n):
    def deco(func):
        def wrapper(*a, **k):
            return [func(*a, **k) for _ in range(n)]
        return wrapper
    return deco

@repeat(3)
def hi(): return "hi"
hi()  # ['hi','hi','hi']</code></pre>
<p><b>执行顺序：</b>repeat(3) → 返回 deco → @deco 包裹 hi → 得到 wrapper。建议用 functools.wraps 保留原函数元信息。</p>`,
  },
  // ---------- 前端 ----------
  {
    id: 'iv-fe-1',
    category: 'frontend',
    difficulty: 'middle',
    question: 'var、let、const 的区别？什么是变量提升（Hoisting）？',
    tags: ['JavaScript', '作用域', 'ES6'],
    answer: `
<p><b>区别：</b></p>
<ul>
  <li>var：函数作用域、可重复声明、会提升且初始化为 undefined</li>
  <li>let：块级作用域、不可重复声明、存在"暂时性死区"（声明前访问报错）</li>
  <li>const：块级作用域、声明后<b>引用</b>不可变（对象内部属性可变）</li>
</ul>
<p><b>变量提升：</b>JS 引擎在编译阶段把变量/函数声明移到作用域顶部。var 提升并赋 undefined；let/const 提升但不初始化（TDZ）；函数声明整体提升。</p>`,
  },
  {
    id: 'iv-fe-2',
    category: 'frontend',
    difficulty: 'hard',
    question: 'React 中 useState 和 useEffect 的工作原理？为什么 useEffect 依赖数组很重要？',
    tags: ['React', 'Hooks', '渲染'],
    answer: `
<p><b>useState：</b>在函数组件里保存状态；每次渲染是一个独立闭包快照，setState 触发重新渲染并用新值替换。</p>
<p><b>useEffect：</b>处理副作用（订阅、请求、DOM 操作）。依赖数组决定<b>何时重新执行</b>：</p>
<ul>
  <li>空数组 []：仅挂载时执行一次</li>
  <li>省略：每次渲染都执行（慎用）</li>
  <li>有依赖：依赖变化才执行，并在下次执行前运行清理函数</li>
</ul>
<p>依赖写错会导致：闭包捕获到旧值、重复请求、内存泄漏。eslint 的 exhaustive-deps 规则可辅助检查。</p>`,
  },
  {
    id: 'iv-fe-3',
    category: 'frontend',
    difficulty: 'middle',
    question: '什么是回流（Reflow）和重绘（Repaint）？如何减少它们？',
    tags: ['性能', '渲染', '回流'],
    answer: `
<p><b>回流：</b>几何属性变化（宽高、位置、增删节点）导致布局重新计算，代价大。</p>
<p><b>重绘：</b>仅外观变化（颜色、背景）不涉及布局，代价较小。</p>
<p><b>优化：</b></p>
<ul>
  <li>用 transform/opacity 触发合成层（GPU），避免回流</li>
  <li>批量 DOM 操作（DocumentFragment / 先隐藏再改）</li>
  <li>避免频繁读写字面布局属性（读写分离，用变量缓存）</li>
  <li>复杂动画用 will-change / requestAnimationFrame</li>
</ul>`,
  },
  // ---------- AI ----------
  {
    id: 'iv-ai-1',
    category: 'ai',
    difficulty: 'middle',
    question: '什么是 RAG？它解决了大模型的哪些问题？',
    tags: ['RAG', '大模型', '幻觉'],
    answer: `
<p><b>RAG（检索增强生成）：</b>先根据用户问题从知识库检索相关文档片段，拼进提示词再让 LLM 基于这些证据作答。</p>
<p><b>解决的问题：</b></p>
<ul>
  <li><b>幻觉</b>：回答有检索证据支撑，可追溯来源</li>
  <li><b>知识时效</b>：模型训练数据有截止日期，RAG 可接入最新/私有数据</li>
  <li><b>私有数据</b>：无需微调即可用企业内部文档问答</li>
</ul>
<p>相比微调，RAG 更新成本低（改文档即可），更适合知识频繁变化场景。</p>`,
  },
  {
    id: 'iv-ai-2',
    category: 'ai',
    difficulty: 'hard',
    question: 'Agent（智能体）与传统 LLM 调用的区别？Tool Calling 是如何工作的？',
    tags: ['Agent', 'Tool Calling', '编排'],
    answer: `
<p><b>区别：</b>传统调用是"一次提问一次回答"；Agent 让模型<b>自主规划、循环调用工具、根据结果迭代</b>直到完成任务。</p>
<p><b>Tool Calling 流程：</b></p>
<ol>
  <li>开发者用 JSON Schema 描述可用工具（名称、参数、用途）</li>
  <li>把工具列表随对话发给支持 function calling 的模型</li>
  <li>模型不直接回答，而是输出"要调用 tool_x，参数 {...}"</li>
  <li>运行时执行该工具，把结果回灌模型</li>
  <li>模型据结果继续思考/调用，直到给出最终答案</li>
</ol>
<p>关键点：明确的停止条件、错误恢复、工具结果回灌的上下文管理。</p>`,
  },
  {
    id: 'iv-ai-3',
    category: 'ai',
    difficulty: 'middle',
    question: '模型量化（Quantization）是什么？INT8/INT4 有什么利弊？',
    tags: ['量化', '部署', '推理'],
    answer: `
<p><b>量化：</b>把模型权重从高精度（FP16/BF16）转为低精度（INT8/INT4），降低显存与计算量。</p>
<p><b>利弊：</b></p>
<ul>
  <li>优点：显存占用大幅下降（如 7B 模型 INT4 仅约 4GB）、推理更快、可上消费级显卡/端侧</li>
  <li>缺点：精度略有损失，极端低比特（如 2bit）可能明显退化；需选合适量化方法（GPTQ/AWQ/GGUF）</li>
</ul>
<p>实践：对话/通用任务 INT4 通常可接受；对精度敏感任务保留 INT8 或 FP16。</p>`,
  },
  // ---------- 系统设计 ----------
  {
    id: 'iv-sys-1',
    category: 'system',
    difficulty: 'hard',
    question: '如何设计一个短链（短网址）服务？',
    tags: ['系统设计', '分布式', '缓存'],
    answer: `
<p><b>核心流程：</b>长链 → 生成短码 → 存储映射 → 访问短链 302 重定向到长链。</p>
<p><b>短码生成：</b></p>
<ul>
  <li>分布式自增 ID（雪花算法）+ Base62 编码</li>
  <li>或哈希（MD5）取片段 + 冲突重试</li>
</ul>
<p><b>存储：</b>关系库（短码做主键）或 KV 存储；命中率高的加 <b>Redis 缓存</b>。</p>
<p><b>优化：</b></p>
<ul>
  <li>重定向用 301（缓存友好）还是 302（便于统计点击）——通常 302</li>
  <li>布隆过滤器防缓存穿透；限流防滥用</li>
  <li>统计点击量可异步写（消息队列）</li>
</ul>`,
  },
  {
    id: 'iv-sys-2',
    category: 'system',
    difficulty: 'hard',
    question: '如何设计一个支持高并发的秒杀系统？',
    tags: ['系统设计', '高并发', '削峰'],
    answer: `
<p><b>核心矛盾：</b>瞬时海量请求 vs 有限库存，关键在于<b>削峰、限流、防超卖</b>。</p>
<p><b>分层设计：</b></p>
<ul>
  <li><b>前端</b>：按钮置灰防重复点击、静态资源 CDN</li>
  <li><b>网关</b>：限流（令牌桶）、黑名单、验证码/答题削峰</li>
  <li><b>服务</b>：请求入 <b>消息队列</b> 异步处理，削峰填谷</li>
  <li><b>库存</b>：Redis 预扣减（原子 DECR）+ 异步落库；用 Lua 脚本保证"判断+扣减"原子性防超卖</li>
  <li><b>数据库</b>：最终一致性扣减，热点行优化</li>
</ul>`,
  },
];
