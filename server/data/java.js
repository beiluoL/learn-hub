// Java 学习文章内容
// content 使用 HTML 片段，前端用 dangerouslySetInnerHTML 渲染
export const javaArticles = [
  {
    id: 'java-basics',
    title: 'Java 基础语法与数据类型',
    level: 'beginner',
    readMinutes: 12,
    tags: ['基础', '数据类型', '变量'],
    summary: '掌握 Java 的基本类型、引用类型、运算符与控制流，搭建扎实的语法基础。',
    content: `
<h2>一、基础类型（Primitive Types）</h2>
<p>Java 有 8 种基础类型，直接存储值，性能高：</p>
<ul>
  <li><b>整数</b>：byte(8)、short(16)、<b>int(32)</b>、long(64)</li>
  <li><b>浮点</b>：float(32)、<b>double(64)</b></li>
  <li><b>字符</b>：char(16，UTF-16)</li>
  <li><b>布尔</b>：boolean（true / false）</li>
</ul>
<pre><code>int age = 18;
double price = 9.9;
boolean active = true;
long big = 1000L;        // long 字面量需加 L
float f = 3.14f;         // float 字面量需加 f</code></pre>

<h2>二、引用类型与包装类</h2>
<p>除基础类型外都是引用类型（对象）。每个基础类型都有对应的包装类，便于在集合中存放：</p>
<pre><code>Integer i = 100;          // 自动装箱
int x = i;                // 自动拆箱
Double d = 3.14;</code></pre>
<p>注意：<code>Integer</code> 在 <b>-128 ~ 127</b> 之间有缓存，<code>==</code> 比较的是引用，推荐使用 <code>equals</code> 比较值。</p>

<h2>三、控制流</h2>
<pre><code>for (int i = 0; i &lt; 10; i++) { ... }

for (String s : list) { ... }   // 增强 for

if (score &gt;= 90) { ... }
else if (score &gt;= 60) { ... }
else { ... }

switch (day) {
  case "MON" -&gt; System.out.println("周一");
  case "TUE" -&gt; System.out.println("周二");
  default -&gt; System.out.println("其他");
}</code></pre>
<p>Java 14+ 支持 <code>switch</code> 表达式（箭头语法），更简洁且避免贯穿（fall-through）问题。</p>
`,
  },
  {
    id: 'java-oop',
    title: '面向对象：封装、继承、多态',
    level: 'beginner',
    readMinutes: 14,
    tags: ['OOP', '继承', '多态', '接口'],
    summary: '理解 Java 面向对象三大特性，以及接口与抽象类的取舍。',
    content: `
<h2>一、封装（Encapsulation）</h2>
<p>将字段私有化，通过 getter/setter 暴露，控制读写逻辑与校验：</p>
<pre><code>public class User {
  private int age;
  public void setAge(int age) {
    if (age &lt; 0) throw new IllegalArgumentException("年龄非法");
    this.age = age;
  }
  public int getAge() { return age; }
}</code></pre>

<h2>二、继承（Inheritance）</h2>
<p>子类复用父类能力，使用 <code>extends</code>。Java 只支持<b>单继承</b>。构造时先调用父类构造器：</p>
<pre><code>class Animal { void eat() { ... } }
class Cat extends Animal { void meow() { ... } }</code></pre>

<h2>三、多态（Polymorphism）</h2>
<p>父类引用指向子类对象，运行时根据实际类型调用方法（动态绑定）：</p>
<pre><code>Animal a = new Cat();
a.eat();   // 运行时调用 Cat 的实际实现</code></pre>

<h2>四、接口 vs 抽象类</h2>
<table>
  <tr><th>维度</th><th>接口 interface</th><th>抽象类 abstract class</th></tr>
  <tr><td>继承</td><td>可多实现</td><td>单继承</td></tr>
  <tr><td>字段</td><td>默认 public static final</td><td>普通实例字段</td></tr>
  <tr><td>构造器</td><td>无</td><td>有</td></tr>
  <tr><td>适用</td><td>定义"能做什么"（能力）</td><td>复用"是什么"（共性）</td></tr>
</table>
<p>优先用接口定义契约，用抽象类沉淀公共实现。</p>
`,
  },
  {
    id: 'java-collections',
    title: '集合框架：List / Set / Map',
    level: 'intermediate',
    readMinutes: 16,
    tags: ['集合', 'HashMap', '并发', '性能'],
    summary: '吃透 Java 集合体系，重点理解 HashMap 的底层结构与扩容机制。',
    content: `
<h2>一、集合体系概览</h2>
<ul>
  <li><b>List</b>（有序可重复）：ArrayList、LinkedList、Vector</li>
  <li><b>Set</b>（不可重复）：HashSet、LinkedHashSet、TreeSet</li>
  <li><b>Map</b>（键值对）：HashMap、LinkedHashMap、TreeMap、ConcurrentHashMap</li>
</ul>

<h2>二、ArrayList vs LinkedList</h2>
<table>
  <tr><th>操作</th><th>ArrayList</th><th>LinkedList</th></tr>
  <tr><td>随机访问</td><td>O(1) 快</td><td>O(n) 慢</td></tr>
  <tr><td>尾部插入</td><td>均摊 O(1)</td><td>O(1)</td></tr>
  <tr><td>中间插入</td><td>O(n) 搬移</td><td>O(1) 改指针</td></tr>
</ul>
<p>绝大多数场景优先 ArrayList；频繁在首尾增删才考虑 LinkedList。</p>

<h2>三、HashMap 核心原理</h2>
<p>JDK 1.8 后结构为<b>数组 + 链表 + 红黑树</b>：</p>
<ul>
  <li>key 计算 hash，定位桶下标：(n - 1) &amp; hash</li>
  <li>链表长度 &gt;= 8 且数组容量 &gt;= 64 时转红黑树，&lt;= 6 退化回链表</li>
  <li>负载因子默认 0.75，容量达 <code>容量×0.75</code> 时扩容为 2 倍并 rehash</li>
</ul>
<pre><code>Map&lt;String, Integer&gt; map = new HashMap&lt;&gt;();
map.put("a", 1);
map.getOrDefault("b", 0);</code></pre>
<p>线程安全请用 <code>ConcurrentHashMap</code>（分段/CAS + synchronized 锁桶），不要用 <code>Hashtable</code> 或 <code>Collections.synchronizedMap</code>（粗粒度锁，性能差）。</p>
`,
  },
  {
    id: 'java-concurrency',
    title: '并发编程：线程、线程池与并发容器',
    level: 'advanced',
    readMinutes: 20,
    tags: ['并发', '线程池', '锁', 'JUC'],
    summary: '理解线程模型、线程池参数与常见并发工具，写出安全的多线程代码。',
    content: `
<h2>一、创建线程的三种方式</h2>
<pre><code>// 1. 继承 Thread
// 2. 实现 Runnable
Runnable r = () -&gt; System.out.println("run");
new Thread(r).start();

// 3. 实现 Callable（有返回值 + 抛异常）
Callable&lt;Integer&gt; c = () -&gt; 42;
Future&lt;Integer&gt; f = executor.submit(c);</code></pre>

<h2>二、线程池（ThreadPoolExecutor）</h2>
<p>核心参数决定行为：</p>
<ul>
  <li><b>corePoolSize</b>：核心线程数，常驻</li>
  <li><b>maximumPoolSize</b>：最大线程数</li>
  <li><b>keepAliveTime</b>：非核心线程空闲存活时间</li>
  <li><b>workQueue</b>：任务队列（ArrayBlockingQueue / LinkedBlockingQueue / SynchronousQueue）</li>
  <li><b>handler</b>：拒绝策略（AbortPolicy / CallerRunsPolicy / DiscardPolicy）</li>
</ul>
<pre><code>ExecutorService pool = new ThreadPoolExecutor(
  4, 8, 60, TimeUnit.SECONDS,
  new LinkedBlockingQueue&lt;&gt;(1000),
  new ThreadPoolExecutor.CallerRunsPolicy());</code></pre>
<p>不要直接用 <code>Executors.newFixedThreadPool</code> 等——其无界队列可能堆积导致 OOM，建议手动构造并明确队列容量。</p>

<h2>三、常用并发工具（JUC）</h2>
<ul>
  <li><code>synchronized</code>：JVM 内置锁，可重入，1.6 后做了锁升级（偏向→轻量→重量）</li>
  <li><code>ReentrantLock</code>：可中断、公平锁、多条件变量</li>
  <li><code>volatile</code>：保证可见性 + 禁止重排序，不保证原子性</li>
  <li><code>CountDownLatch / CyclicBarrier / Semaphore</code>：线程协作</li>
  <li><code>ConcurrentHashMap / CopyOnWriteArrayList</code>：并发容器</li>
</ul>
<p>口诀：计数用原子类（<code>AtomicInteger</code>），复合操作用锁或 <code>LongAdder</code>。</p>
`,
  },
  {
    id: 'java-jvm',
    title: 'JVM 内存模型与垃圾回收',
    level: 'advanced',
    readMinutes: 18,
    tags: ['JVM', 'GC', '内存', '调优'],
    summary: '理解运行时数据区、对象创建过程与主流垃圾回收器，具备基础调优能力。',
    content: `
<h2>一、运行时数据区</h2>
<ul>
  <li><b>堆</b>：对象实例，GC 主战场（新生代 Eden/Survivor、老年代）</li>
  <li><b>方法区/元空间</b>：类信息、常量、静态变量（元空间使用本地内存）</li>
  <li><b>虚拟机栈</b>：每个线程私有，存放栈帧（局部变量、操作数栈）</li>
  <li><b>程序计数器</b>：当前线程执行位置</li>
  <li><b>本地方法栈</b>：Native 方法</li>
</ul>

<h2>二、对象创建流程</h2>
<p>new → 类加载检查 → 分配内存（指针碰撞 / 空闲列表）→ 初始化零值 → 设置对象头 → 执行 &lt;init&gt;</p>

<h2>三、垃圾回收</h2>
<p>判定对象是否存活：<b>可达性分析</b>（GC Roots 引用链）。常见 GC：</p>
<table>
  <tr><th>回收器</th><th>特点</th><th>适用</th></tr>
  <tr><td>Serial</td><td>单线程，简单</td><td>客户端小应用</td></tr>
  <tr><td>Parallel（吞吐量优先）</td><td>多线程收集</td><td>后台计算</td></tr>
  <tr><td>CMS（停顿优先）</td><td>并发标记清除</td><td>已逐步废弃</td></tr>
  <tr><td><b>G1</b></td><td>分 Region，可预测停顿</td><td>服务端主流</td></tr>
  <tr><td>ZGC</td><td>亚毫秒停顿，TB 级堆</td><td>超低延迟</td></tr>
</table>
<pre><code>// 常见启动参数示例
java -Xms2g -Xmx2g -XX:+UseG1GC -XX:MaxGCPauseMillis=200 MyApp</code></pre>
`,
  },
  {
    id: 'java-stream',
    title: 'Java 8+ 新特性：Lambda 与 Stream',
    level: 'intermediate',
    readMinutes: 13,
    tags: ['Java8', 'Lambda', 'Stream', '函数式'],
    summary: '用 Lambda 与 Stream 写出声明式、易并行的高可读代码。',
    content: `
<h2>一、Lambda 表达式</h2>
<p>函数式接口（仅一个抽象方法，标注 <code>@FunctionalInterface</code>）可用 Lambda 简写：</p>
<pre><code>List&lt;Integer&gt; nums = Arrays.asList(3, 1, 2);
nums.sort((a, b) -&gt; a - b);          // 替代匿名内部类
Runnable r = () -&gt; System.out.println("hi");</code></pre>

<h2>二、Stream 流式处理</h2>
<p>把集合转为流，链式声明"做什么"而非"怎么做"：</p>
<pre><code>List&lt;String&gt; result = users.stream()
    .filter(u -&gt; u.getAge() &gt;= 18)
    .map(User::getName)
    .sorted()
    .collect(Collectors.toList());</code></pre>
<ul>
  <li><b>中间操作</b>（惰性）：filter / map / flatMap / distinct / sorted</li>
  <li><b>终止操作</b>（触发）：collect / forEach / count / reduce</li>
</ul>
<p>并行流 <code>parallelStream()</code> 利用 ForkJoinPool，但要注意线程安全与共享可变状态。</p>

<h2>三、其他实用新特性</h2>
<ul>
  <li><code>Optional</code>：优雅处理 null，避免 NPE</li>
  <li><code>var</code>（Java 10）：局部变量类型推断</li>
  <li>record（Java 16）：不可变数据载体，自动生成构造/getter/equals</li>
  <li>文本块（Java 15+）：<code>"""..."""</code> 多行字符串</li>
</ul>
<pre><code>record Point(int x, int y) {}
Optional.ofNullable(name).ifPresent(System.out::println);</code></pre>
`,
  },
];
