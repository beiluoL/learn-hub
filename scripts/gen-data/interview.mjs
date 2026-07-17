export default [
  {
    id: 'iv-java',
    name: 'Java 面试',
    tier: 'key',
    difficulty: 'hard',
    chapters: [
      {
        slug: 'jvm-gc',
        title: 'JVM 垃圾回收',
        tier: 'key',
        difficulty: 'hard',
        summary: '分代回收、GC 算法与常见收集器原理',
        intro: '理解对象存活判定与回收过程是 Java 岗必考基础。',
        points: [
          '可达性分析：以 GC Roots 为起点，不可达对象可被回收',
          '分代假说：新生代(Minor GC)与老年代(Major/Full GC)',
          '常见收集器：CMS(并发标记清除)、G1(分 Region 可预测停顿)、ZGC',
          'Stop-The-World：除 ZGC/Shenandoah 外收集均存在 STW',
        ],
        code: {
          lang: 'java',
          body: `// 触发 Full GC 的典型方式（仅演示，勿滥用）
public class GcDemo {
    public static void main(String[] args) {
        System.gc(); // 建议 JVM 进行 GC，不保证立即执行
        Runtime.getRuntime().gc();
    }
}`,
        },
        note: '注意：System.gc() 只是建议；G1 通过 MaxGCPauseMillis 设定目标停顿。',
        checklist: ['能说出 GC Roots 包含哪些', '能对比 CMS 与 G1 差异'],
        tags: ['JVM', 'GC'],
        readMinutes: 12,
      },
      {
        slug: 'jvm-memory',
        title: 'JVM 内存模型',
        tier: 'core',
        difficulty: 'medium',
        summary: '运行时数据区与对象创建的内存流转',
        points: [
          '线程私有：程序计数器、虚拟机栈、本地方法栈',
          '线程共享：堆、方法区(元空间)',
          '对象创建：类加载检查→分配内存→初始化零值→设置对象头→执行 init',
          '指针碰撞 vs 空闲列表，配合 CAS 或 TLAB 解决并发',
        ],
        code: {
          lang: 'java',
          body: `// 栈溢出示例
public class StackDemo {
    static void recurse() { recurse(); } // StackOverflowError
    public static void main(String[] args) {
        recurse();
    }
}`,
        },
        note: '元空间使用本地内存，默认受系统限制，可配置 MaxMetaspaceSize。',
        checklist: ['能画出运行时数据区', '能解释 OOM 的常见区域'],
        tags: ['JVM', '内存'],
        readMinutes: 10,
      },
      {
        slug: 'concurrent-thread',
        title: '并发与线程池',
        tier: 'key',
        difficulty: 'hard',
        summary: '线程状态、线程池参数与拒绝策略',
        points: [
          '六种状态：NEW/RUNNABLE/BLOCKED/WAITING/TIMED_WAITING/TERMINATED',
          'ThreadPoolExecutor 七大参数（核心/最大线程、队列、拒绝策略等）',
          '拒绝策略：AbortPolicy/DiscardPolicy/DiscardOldestPolicy/CallerRunsPolicy',
          'Executors 固定/缓存线程池的隐患（OOM/资源耗尽）',
        ],
        code: {
          lang: 'java',
          body: `ExecutorService pool = new ThreadPoolExecutor(
    2, 4, 60L, TimeUnit.SECONDS,
    new LinkedBlockingQueue<>(100),
    Executors.defaultThreadFactory(),
    new ThreadPoolExecutor.CallerRunsPolicy());`,
        },
        note: '生产推荐手动创建线程池，避免使用 Executors 快捷方法。',
        checklist: ['能解释每个参数含义', '能说出拒绝策略适用场景'],
        tags: ['并发', '线程池'],
        readMinutes: 13,
      },
      {
        slug: 'concurrent-lock',
        title: '并发锁与 JUC',
        tier: 'key',
        difficulty: 'hard',
        summary: 'synchronized、ReentrantLock 与 AQS',
        points: [
          'synchronized 锁升级：无锁→偏向锁→轻量级锁→重量级锁',
          'ReentrantLock 支持可中断、公平锁、多条件 Condition',
          'AQS：基于 state + CLH 队列实现独占/共享同步',
          'volatile 保证可见性与有序性（禁止指令重排）',
        ],
        code: {
          lang: 'java',
          body: `ReentrantLock lock = new ReentrantLock();
lock.lock();
try {
    // 临界区
} finally {
    lock.unlock(); // 必须在 finally 释放
}`,
        },
        note: 'AQS 是 ReentrantLock/Semaphore/CountDownLatch 的基础。',
        checklist: ['能讲锁升级过程', '能说 AQS 工作原理'],
        tags: ['并发', 'JUC', '锁'],
        readMinutes: 14,
      },
      {
        slug: 'collection-map',
        title: '集合框架',
        tier: 'core',
        difficulty: 'medium',
        summary: 'HashMap、ConcurrentHashMap 与常见集合',
        points: [
          'HashMap：数组+链表+红黑树，负载因子 0.75，树化阈值 8',
          '扩容：容量翻倍并 rehash，1.8 优化为高低位拆分',
          'ConcurrentHashMap：1.8 用 CAS + synchronized 锁桶',
          'ArrayList 与 LinkedList 的随机访问/插入差异',
        ],
        code: {
          lang: 'java',
          body: `Map<String, Integer> map = new ConcurrentHashMap<>();
map.put("a", 1);
map.computeIfAbsent("b", k -> 2);
System.out.println(map.get("b"));`,
        },
        note: '1.7 及之前 ConcurrentHashMap 使用分段锁 Segment。',
        checklist: ['能说 HashMap 扩容机制', '能说 1.7 与 1.8 差异'],
        tags: ['集合', 'HashMap'],
        readMinutes: 11,
      },
      {
        slug: 'spring-bean',
        title: 'Spring Bean 与 IoC',
        tier: 'key',
        difficulty: 'medium',
        summary: 'Bean 生命周期、作用域与循环依赖',
        points: [
          'IoC：控制反转，容器管理对象创建与依赖注入',
          '生命周期：实例化→属性填充→Aware→初始化→可用→销毁',
          '作用域：singleton/prototype/request/session',
          '三级缓存解决 singleton 循环依赖',
        ],
        code: {
          lang: 'java',
          body: `@Service
public class UserService {
    @Autowired
    private OrderService orderService; // 依赖注入
}`,
        },
        note: 'prototype 多例的循环依赖无法解决，会抛 BeanCurrentlyInCreationException。',
        checklist: ['能说生命周期回调', '能解释三级缓存'],
        tags: ['Spring', 'IoC'],
        readMinutes: 10,
      },
      {
        slug: 'jmm-volatile',
        title: 'Java 内存模型与原子类',
        tier: 'extra',
        difficulty: 'hard',
        summary: 'JMM、happens-before 与原子操作',
        points: [
          'JMM 抽象：主内存与线程工作内存',
          'happens-before 规则保证可见性与有序性',
          '原子类 AtomicInteger 基于 CAS 自旋',
          'ABA 问题及 AtomicStampedReference 解决',
        ],
        code: {
          lang: 'java',
          body: `AtomicInteger count = new AtomicInteger(0);
count.incrementAndGet();      // 原子自增
boolean ok = count.compareAndSet(1, 2); // CAS`,
        },
        note: 'CAS 自旋在竞争激烈时可能带来额外开销。',
        checklist: ['能说 happens-before', '能解释 ABA'],
        tags: ['JMM', '原子类'],
        readMinutes: 12,
      },
    ],
    cases: [
      {
        slug: 'case-lru',
        title: '手写 LRU 缓存',
        tier: 'key',
        difficulty: 'hard',
        summary: '用 LinkedHashMap 或 HashMap+双向链表实现容量受限缓存',
        points: [
          '维持访问顺序，淘汰最久未使用节点',
          'get/put 均为 O(1)',
          'LinkedHashMap 重写 removeEldestEntry',
        ],
        code: {
          lang: 'java',
          body: `class LRUCache extends LinkedHashMap<Integer, Integer> {
    private final int cap;
    LRUCache(int cap) { super(cap, 0.75f, true); this.cap = cap; }
    public int get(int k) { return super.getOrDefault(k, -1); }
    public void put(int k, int v) { super.put(k, v); }
    protected boolean removeEldestEntry(Map.Entry e) { return size() > cap; }
}`,
        },
        checklist: ['get/put 复杂度 O(1)', '淘汰策略正确', '线程安全可加分'],
        readMinutes: 18,
      },
      {
        slug: 'case-prodconsumer',
        title: '生产者-消费者模型',
        tier: 'key',
        difficulty: 'hard',
        summary: '用 BlockingQueue 实现线程安全的生产消费解耦',
        points: [
          '阻塞队列自动处理满/空等待',
          'put 阻塞、take 阻塞',
          '可替代手写 wait/notify',
        ],
        code: {
          lang: 'java',
          body: `BlockingQueue<Integer> q = new ArrayBlockingQueue<>(10);
// 生产者
q.put(1);
// 消费者
Integer v = q.take();`,
        },
        checklist: ['能说明阻塞语义', '能写出完整 Demo'],
        readMinutes: 16,
      },
    ],
  },

  {
    id: 'iv-fe',
    name: '前端面试',
    tier: 'key',
    difficulty: 'hard',
    chapters: [
      {
        slug: 'js-closure',
        title: 'JS 闭包与作用域',
        tier: 'core',
        difficulty: 'medium',
        summary: '词法作用域、闭包形成与经典坑',
        points: [
          '闭包：函数捕获其词法作用域的变量',
          'for 循环 var 闭包陷阱，let 块级作用域解决',
          '闭包可用于私有变量、函数工厂、防抖节流',
        ],
        code: {
          lang: 'javascript',
          body: `function createCounter() {
  let count = 0;
  return () => ++count;
}
const c = createCounter();
console.log(c(), c()); // 1 2`,
        },
        note: '闭包会导致变量无法被回收，注意内存占用。',
        checklist: ['能解释闭包原理', '能举出应用场景'],
        tags: ['JS', '闭包'],
        readMinutes: 9,
      },
      {
        slug: 'js-eventloop',
        title: '事件循环与宏微任务',
        tier: 'key',
        difficulty: 'hard',
        summary: 'Event Loop、Promise 与渲染时机',
        points: [
          '宏任务：script/setTimeout/setInterval/I/O',
          '微任务：Promise.then/MutationObserver/queueMicrotask',
          '每轮宏任务后清空微任务队列再渲染',
          'async/await 本质是 Promise 语法糖',
        ],
        code: {
          lang: 'javascript',
          body: `console.log(1);
setTimeout(() => console.log(2));
Promise.resolve().then(() => console.log(3));
console.log(4);
// 输出: 1 4 3 2`,
        },
        note: 'node 与浏览器在 timer 与微任务优先级上略有差异。',
        checklist: ['能预测输出顺序', '能说宏微任务区别'],
        tags: ['JS', 'EventLoop'],
        readMinutes: 12,
      },
      {
        slug: 'js-prototype',
        title: '原型与继承',
        tier: 'core',
        difficulty: 'medium',
        summary: '原型链、class 与寄生组合继承',
        points: [
          '每个对象有 __proto__，函数有 prototype',
          '属性查找沿原型链向上',
          'class extends 基于原型链 + 构造函数',
          'instanceof 依赖原型链',
        ],
        code: {
          lang: 'javascript',
          body: `class Animal { constructor(n){ this.name=n; } }
class Dog extends Animal {
  bark() { return this.name + ' bark'; }
}
console.log(new Dog('a').bark());`,
        },
        note: 'ES6 class 本质是原型继承的语法糖。',
        checklist: ['能画原型链', '能说继承实现'],
        tags: ['JS', '原型'],
        readMinutes: 10,
      },
      {
        slug: 'browser-render',
        title: '浏览器渲染与重排重绘',
        tier: 'key',
        difficulty: 'medium',
        summary: '关键渲染路径、回流与重绘优化',
        points: [
          '流程：HTML→DOM、CSS→CSSOM→Render Tree→Layout→Paint→Composite',
          '重排(Reflow)改变几何，重绘(Repaint)仅视觉',
          'transform/opacity 走合成层，性能更好',
        ],
        code: {
          lang: 'javascript',
          body: `// 批量读写避免强制同步布局
const el = document.getElementById('box');
const w = el.offsetWidth; // 读
el.style.height = w + 'px'; // 写`,
        },
        note: '脱离文档流或绝对定位可减少重排影响范围。',
        checklist: ['能说渲染流程', '能列优化手段'],
        tags: ['浏览器', '渲染'],
        readMinutes: 11,
      },
      {
        slug: 'fe-http',
        title: 'HTTP 与缓存',
        tier: 'core',
        difficulty: 'medium',
        summary: '状态码、强缓存与协商缓存',
        points: [
          '强缓存：Cache-Control / Expires',
          '协商缓存：ETag / Last-Modified',
          '301 永久、302 临时、304 未修改',
          'HTTPS = HTTP + TLS 加密',
        ],
        code: {
          lang: 'http',
          body: `GET /a.js HTTP/1.1
Host: example.com
If-None-Match: "abc123"

HTTP/1.1 304 Not Modified
Cache-Control: max-age=3600`,
        },
        note: 'ETag 精度优于 Last-Modified，避免秒级缓存失效。',
        checklist: ['能区分两类缓存', '能说状态码含义'],
        tags: ['HTTP', '缓存'],
        readMinutes: 9,
      },
      {
        slug: 'fe-vue',
        title: 'Vue 响应式原理',
        tier: 'key',
        difficulty: 'hard',
        summary: 'Object.defineProperty 与 Proxy 响应式',
        points: [
          'Vue2 用 Object.defineProperty 劫持 getter/setter',
          'Vue3 用 Proxy 代理，支持数组/新增属性',
          '依赖收集：Dep 收集 Watcher，数据变更触发更新',
        ],
        code: {
          lang: 'javascript',
          body: `const data = { n: 1 };
const p = new Proxy(data, {
  set(t, k, v) { t[k] = v; console.log('update', k); return true; }
});
p.n = 2;`,
        },
        note: 'Vue2 对新增属性需用 Vue.set 才能触发响应。',
        checklist: ['能说响应式流程', '能对比 2 与 3'],
        tags: ['Vue', '响应式'],
        readMinutes: 13,
      },
      {
        slug: 'fe-engineering',
        title: '前端工程化',
        tier: 'extra',
        difficulty: 'medium',
        summary: '构建工具、模块化与 CI',
        points: [
          '模块化：ESM / CommonJS 差异',
          'Webpack 打包 vs Vite 基于 ESM 的开发服务',
          'Tree Shaking 依赖 ESM 静态分析',
          '代码分割、懒加载优化首屏',
        ],
        code: {
          lang: 'javascript',
          body: `// 动态导入实现懒加载
const mod = await import('./heavy.js');
mod.run();`,
        },
        note: 'Vite 生产环境仍用 Rollup 打包。',
        checklist: ['能说 ESM 与 CJS 区别', '能说 Tree Shaking'],
        tags: ['工程化', '构建'],
        readMinutes: 10,
      },
    ],
    cases: [
      {
        slug: 'case-debounce',
        title: '手写防抖与节流',
        tier: 'key',
        difficulty: 'medium',
        summary: '实现 debounce 与 throttle 控制高频触发',
        points: [
          '防抖：停止触发后延迟执行',
          '节流：固定间隔最多执行一次',
          '可用于搜索联想、滚动监听',
        ],
        code: {
          lang: 'javascript',
          body: `function debounce(fn, wait) {
  let t;
  return (...a) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...a), wait);
  };
}`,
        },
        checklist: ['防抖节流正确', '能说明适用场景'],
        readMinutes: 14,
      },
      {
        slug: 'case-promise',
        title: '手写 Promise.all',
        tier: 'key',
        difficulty: 'hard',
        summary: '并发控制与结果聚合的 Promise.all 实现',
        points: [
          '全部成功才 resolve，任一失败即 reject',
          '结果按输入顺序返回',
          '空数组直接 resolve',
        ],
        code: {
          lang: 'javascript',
          body: `function promiseAll(list) {
  return new Promise((resolve, reject) => {
    const res = []; let cnt = 0;
    list.forEach((p, i) => {
      Promise.resolve(p).then(v => {
        res[i] = v;
        if (++cnt === list.length) resolve(res);
      }, reject);
    });
  });
}`,
        },
        checklist: ['顺序正确', '失败短路', '边界处理'],
        readMinutes: 16,
      },
    ],
  },

  {
    id: 'iv-py',
    name: 'Python 面试',
    tier: 'key',
    difficulty: 'medium',
    chapters: [
      {
        slug: 'py-decorator',
        title: '装饰器',
        tier: 'core',
        difficulty: 'medium',
        summary: '函数装饰器、类装饰器与 functools.wraps',
        points: [
          '装饰器是高阶函数，接收函数返回新函数',
          '叠加装饰器由内向外执行',
          'functools.wraps 保留原函数元信息',
        ],
        code: {
          lang: 'python',
          body: `import functools

def log(func):
    @functools.wraps(func)
    def wrapper(*a, **k):
        print('call', func.__name__)
        return func(*a, **k)
    return wrapper

@log
def add(x, y): return x + y`,
        },
        note: '带参装饰器需再包一层闭包。',
        checklist: ['能写装饰器', '能说 wraps 作用'],
        tags: ['Python', '装饰器'],
        readMinutes: 9,
      },
      {
        slug: 'py-gil',
        title: 'GIL 全局解释器锁',
        tier: 'key',
        difficulty: 'hard',
        summary: 'GIL 成因、影响与绕过方式',
        points: [
          'GIL 保证同一时刻只有一个线程执行字节码',
          'CPU 密集型多线程无法利用多核',
          'IO 密集型受 GIL 影响小',
          '多进程(multiprocessing)或 C 扩展可绕过',
        ],
        code: {
          lang: 'python',
          body: `from multiprocessing import Pool

def f(x): return x * x
with Pool(4) as p:
    print(p.map(f, [1, 2, 3]))`,
        },
        note: 'GIL 是 CPython 实现细节，非语言规范。',
        checklist: ['能说 GIL 影响', '能说绕过方案'],
        tags: ['Python', 'GIL'],
        readMinutes: 11,
      },
      {
        slug: 'py-asyncio',
        title: '异步 asyncio',
        tier: 'key',
        difficulty: 'hard',
        summary: '协程、事件循环与 async/await',
        points: [
          'async def 定义协程，await 挂起点',
          '事件循环调度协程，单线程并发',
          'asyncio.gather 并发运行多个任务',
        ],
        code: {
          lang: 'python',
          body: `import asyncio

async def main():
    await asyncio.sleep(1)
    return 'done'

print(asyncio.run(main()))`,
        },
        note: '协程遇到阻塞 IO 才会让出，CPU 密集仍需多进程。',
        checklist: ['能说协程原理', '能用 gather'],
        tags: ['Python', '异步'],
        readMinutes: 12,
      },
      {
        slug: 'py-metaclass',
        title: '元类与鸭子类型',
        tier: 'extra',
        difficulty: 'hard',
        summary: 'type 创建类、元类与动态特性',
        points: [
          '类本身由 type 创建',
          '元类通过 __new__/__init__ 控制类创建',
          'Python 弱类型、鸭子类型：关注行为而非类型',
        ],
        code: {
          lang: 'python',
          body: `class Meta(type):
    def __new__(mcs, n, b, d):
        d['tag'] = 'x'
        return super().__new__(mcs, n, b, d)

class A(metaclass=Meta): pass
print(A.tag)`,
        },
        note: '元类常用于 ORM 字段注册等场景。',
        checklist: ['能说元类', '能说鸭子类型'],
        tags: ['Python', '元类'],
        readMinutes: 13,
      },
      {
        slug: 'py-memory',
        title: '内存管理与垃圾回收',
        tier: 'core',
        difficulty: 'medium',
        summary: '引用计数、循环引用与 GC',
        points: [
          '主要用引用计数，归零即回收',
          '循环引用由分代垃圾回收器处理',
          'gc 模块可手动触发与调参',
        ],
        code: {
          lang: 'python',
          body: `import gc
gc.collect()  # 手动回收循环引用
print(gc.get_threshold())`,
        },
        note: 'sys.getrefcount 会临时 +1，注意解读。',
        checklist: ['能说引用计数', '能说循环引用'],
        tags: ['Python', 'GC'],
        readMinutes: 10,
      },
      {
        slug: 'py-datastruct',
        title: '数据结构与推导式',
        tier: 'basic',
        difficulty: 'easy',
        summary: '列表/字典/集合推导与生成器',
        points: [
          '推导式简洁但勿过度嵌套',
          '生成器 yield 惰性求值省内存',
          'defaultdict/Counter 常用',
        ],
        code: {
          lang: 'python',
          body: `from collections import Counter
c = Counter('aabbc')
print(c)  # Counter({'a':2,'b':2,'c':1})

gen = (x*x for x in range(3))  # 生成器`,
        },
        note: '生成器表达式与列表推导仅差一层括号。',
        checklist: ['能用推导式', '能说生成器'],
        tags: ['Python', '数据结构'],
        readMinutes: 8,
      },
      {
        slug: 'py-copy',
        title: '深浅拷贝',
        tier: 'basic',
        difficulty: 'easy',
        summary: 'copy 与 deepcopy 的差异',
        points: [
          '赋值只是引用',
          '浅拷贝复制一层，嵌套对象共享',
          '深拷贝递归复制全部',
        ],
        code: {
          lang: 'python',
          body: `import copy
a = [[1], [2]]
b = copy.copy(a)
c = copy.deepcopy(a)
a[0][0] = 9
print(b[0][0], c[0][0])  # 9 1`,
        },
        note: '深拷贝可能遇循环引用，copy 模块已处理。',
        checklist: ['能说差异', '能举例'],
        tags: ['Python', '拷贝'],
        readMinutes: 7,
      },
    ],
    cases: [
      {
        slug: 'case-fib',
        title: '手写斐波那契(递归/动态/生成器)',
        tier: 'key',
        difficulty: 'medium',
        summary: '多种实现对比时间与空间复杂度',
        points: [
          '朴素递归 O(2^n)，存在重复子问题',
          '记忆化/动态规划 O(n)',
          '生成器惰性输出序列',
        ],
        code: {
          lang: 'python',
          body: `def fib(n):
    a, b = 0, 1
    for _ in range(n):
        a, b = b, a + b
    return a`,
        },
        checklist: ['多种写法', '复杂度分析正确'],
        readMinutes: 12,
      },
      {
        slug: 'case-singleton',
        title: '实现线程安全单例',
        tier: 'key',
        difficulty: 'hard',
        summary: '用装饰器或元类实现 Python 单例',
        points: [
          '模块级变量天然单例',
          '装饰器缓存实例',
          '__new__ 控制创建',
        ],
        code: {
          lang: 'python',
          body: `def singleton(cls):
    inst = {}
    def get(*a, **k):
        if cls not in inst:
            inst[cls] = cls(*a, **k)
        return inst[cls]
    return get

@singleton
class DB: pass`,
        },
        checklist: ['单例正确', '线程安全可加分'],
        readMinutes: 14,
      },
    ],
  },

  {
    id: 'iv-algo',
    name: '算法与数据结构',
    tier: 'key',
    difficulty: 'hard',
    chapters: [
      {
        slug: 'algo-array',
        title: '数组与双指针',
        tier: 'core',
        difficulty: 'medium',
        summary: '双指针、滑动窗口与前缀和',
        points: [
          '双指针：快慢指针、左右指针',
          '滑动窗口处理子数组/子串最值',
          '前缀和加速区间求和',
        ],
        code: {
          lang: 'java',
          body: `// 原地移除等于 val 的元素
int remove(int[] a, int val) {
    int k = 0;
    for (int x : a) if (x != val) a[k++] = x;
    return k;
}`,
        },
        note: '双指针常把 O(n^2) 降到 O(n)。',
        checklist: ['能写双指针', '能说窗口伸缩'],
        tags: ['数组', '双指针'],
        readMinutes: 10,
      },
      {
        slug: 'algo-linkedlist',
        title: '链表',
        tier: 'core',
        difficulty: 'medium',
        summary: '反转、快慢指针与环检测',
        points: [
          '反转链表：迭代三指针',
          '快慢指针找中点/判环',
          '合并/相交链表',
        ],
        code: {
          lang: 'java',
          body: `ListNode reverse(ListNode h) {
    ListNode p = null;
    while (h != null) {
        ListNode n = h.next;
        h.next = p;
        p = h; h = n;
    }
    return p;
}`,
        },
        note: '环检测：快慢指针相遇则成环。',
        checklist: ['能反转链表', '能判环'],
        tags: ['链表'],
        readMinutes: 11,
      },
      {
        slug: 'algo-tree',
        title: '树与二叉树',
        tier: 'key',
        difficulty: 'hard',
        summary: '遍历、BST 与二叉树属性',
        points: [
          '前中后序、层序遍历',
          '递归与迭代两种写法',
          'BST 性质与平衡树',
        ],
        code: {
          lang: 'java',
          body: `void inorder(TreeNode n) {
    if (n == null) return;
    inorder(n.left);
    System.out.println(n.val);
    inorder(n.right);
}`,
        },
        note: '递归转迭代常用显式栈。',
        checklist: ['能写三种遍历', '能说 BST 性质'],
        tags: ['树', '二叉树'],
        readMinutes: 12,
      },
      {
        slug: 'algo-graph',
        title: '图与搜索',
        tier: 'key',
        difficulty: 'hard',
        summary: 'DFS/BFS、拓扑排序与最短路',
        points: [
          'DFS 用栈/递归，BFS 用队列',
          '拓扑排序判 DAG',
          'Dijkstra/A* 最短路',
        ],
        code: {
          lang: 'plaintext',
          body: `BFS(g, s):
  queue = [s]; visited = {s}
  while queue:
    u = queue.pop()
    for v in g[u]:
      if v not in visited:
        visited.add(v); queue.push(v)`,
        },
        note: '无向图需记录父节点防回边。',
        checklist: ['能写 BFS/DFS', '能说拓扑排序'],
        tags: ['图', '搜索'],
        readMinutes: 13,
      },
      {
        slug: 'algo-dp',
        title: '动态规划',
        tier: 'key',
        difficulty: 'hard',
        summary: '状态定义、转移与背包问题',
        points: [
          '五步法：定义状态→转移→初始化→遍历→优化',
          '0-1 背包、最长子序列',
          '滚动数组压缩空间',
        ],
        code: {
          lang: 'java',
          body: `int maxSub(int[] a) {
    int dp = a[0], ans = dp;
    for (int i = 1; i < a.length; i++) {
        dp = Math.max(a[i], dp + a[i]);
        ans = Math.max(ans, dp);
    }
    return ans;
}`,
        },
        note: 'DP 关键是状态转移的正确性。',
        checklist: ['能定义状态', '能写出转移'],
        tags: ['DP'],
        readMinutes: 14,
      },
      {
        slug: 'algo-binarysearch',
        title: '二分查找',
        tier: 'core',
        difficulty: 'medium',
        summary: '边界处理与变种',
        points: [
          '循环不变量保证正确性',
          '左闭右闭 vs 左闭右开',
          '找第一个/最后一个等于 target',
        ],
        code: {
          lang: 'java',
          body: `int bs(int[] a, int t) {
    int l = 0, r = a.length - 1;
    while (l <= r) {
        int m = l + (r - l) / 2;
        if (a[m] == t) return m;
        else if (a[m] < t) l = m + 1;
        else r = m - 1;
    }
    return -1;
}`,
        },
        note: 'm = l + (r-l)/2 防整数溢出。',
        checklist: ['能写二分', '能处理边界'],
        tags: ['二分'],
        readMinutes: 9,
      },
      {
        slug: 'algo-sort',
        title: '排序与堆',
        tier: 'core',
        difficulty: 'medium',
        summary: '快排/归并/堆排序与 TopK',
        points: [
          '快排平均 O(n log n)，最坏 O(n^2)',
          '归并稳定，需额外空间',
          '堆用于 TopK 与优先队列',
        ],
        code: {
          lang: 'java',
          body: `int topK(int[] a, int k) {
    PriorityQueue<Integer> q = new PriorityQueue<>();
    for (int x : a) { q.offer(x); if (q.size() > k) q.poll(); }
    return q.peek();
}`,
        },
        note: 'TopK 大数用最小堆，空间 O(k)。',
        checklist: ['能说复杂度', '能用堆解 TopK'],
        tags: ['排序', '堆'],
        readMinutes: 11,
      },
    ],
    cases: [
      {
        slug: 'case-lru-algo',
        title: '手写 LRU (算法版)',
        tier: 'key',
        difficulty: 'hard',
        summary: 'HashMap + 双向链表实现 O(1) 缓存',
        points: [
          '头插新节点，尾删最旧',
          '命中移动到头部',
          'get/put O(1)',
        ],
        code: {
          lang: 'java',
          body: `class Node { int k, v; Node prev, next; }
class LRU {
    Map<Integer, Node> m = new HashMap<>();
    Node head = new Node(), tail = new Node();
    int cap;
    LRU(int c){ cap=c; head.next=tail; tail.prev=head; }
}`,
        },
        checklist: ['结构正确', 'get/put O(1)', '边界处理'],
        readMinutes: 20,
      },
      {
        slug: 'case-two-sum',
        title: '两数之和与变体',
        tier: 'core',
        difficulty: 'easy',
        summary: '哈希表 O(n) 解法与三数之和',
        points: [
          '哈希存值与下标',
          '排序双指针处理三数之和去重',
        ],
        code: {
          lang: 'java',
          body: `int[] twoSum(int[] a, int t) {
    Map<Integer, Integer> m = new HashMap<>();
    for (int i = 0; i < a.length; i++) {
        if (m.containsKey(t - a[i])) return new int[]{m.get(t-a[i]), i};
        m.put(a[i], i);
    }
    return new int[]{};
}`,
        },
        checklist: ['哈希解法正确', '复杂度分析'],
        readMinutes: 12,
      },
    ],
  },

  {
    id: 'iv-osnet',
    name: '操作系统与网络',
    tier: 'key',
    difficulty: 'hard',
    chapters: [
      {
        slug: 'os-process',
        title: '进程与线程',
        tier: 'core',
        difficulty: 'medium',
        summary: '区别、通信与上下文切换',
        points: [
          '进程资源分配单位，线程 CPU 调度单位',
          '线程共享地址空间，进程隔离',
          'IPC：管道/消息队列/共享内存/信号/套接字',
        ],
        code: {
          lang: 'plaintext',
          body: `进程: 独立地址空间, 资源开销大
线程: 共享地址空间, 切换开销小
通信: pipe / shared memory / socket / signal`,
        },
        note: '协程是用户态轻量级线程。',
        checklist: ['能说区别', '能列 IPC'],
        tags: ['OS', '进程线程'],
        readMinutes: 10,
      },
      {
        slug: 'os-lock',
        title: '锁与同步',
        tier: 'key',
        difficulty: 'hard',
        summary: '互斥锁、死锁与 PV 操作',
        points: [
          '死锁四条件：互斥/占有等待/不可剥夺/循环等待',
          '预防：按序加锁、超时、银行家算法',
          '信号量 PV 实现同步互斥',
        ],
        code: {
          lang: 'plaintext',
          body: `死锁四条件:
1. 互斥
2. 占有且等待
3. 不可剥夺
4. 循环等待
破坏任一即可预防死锁`,
        },
        note: '实际常用按序加锁 + 超时打破循环等待。',
        checklist: ['能说四条件', '能说预防'],
        tags: ['OS', '锁', '死锁'],
        readMinutes: 12,
      },
      {
        slug: 'os-mem',
        title: '内存管理',
        tier: 'key',
        difficulty: 'hard',
        summary: '分页、分段与虚拟内存',
        points: [
          '虚拟内存隔离进程、扩大可用空间',
          '分页按固定大小，分段按逻辑',
          '页面置换：FIFO/LRU/Clock',
        ],
        code: {
          lang: 'plaintext',
          body: `虚拟地址 -> MMU -> 物理地址
页表: 虚拟页号 -> 物理页框
缺页中断: 页面不在内存时触发`,
        },
        note: 'TLB 缓存页表项加速地址转换。',
        checklist: ['能说虚拟内存', '能说置换算法'],
        tags: ['OS', '内存'],
        readMinutes: 11,
      },
      {
        slug: 'net-tcp',
        title: 'TCP 与 UDP',
        tier: 'key',
        difficulty: 'hard',
        summary: '三次握手、四次挥手与可靠传输',
        points: [
          '三次握手建立连接，四次挥手断开',
          '可靠：序列号/确认/重传/滑动窗口',
          'UDP 无连接、快、可广播',
        ],
        code: {
          lang: 'plaintext',
          body: `SYN -> 
<- SYN+ACK
ACK ->
连接建立
---
FIN -> 
<- ACK
<- FIN
ACK ->
连接关闭`,
        },
        note: 'TIME_WAIT 确保最后 ACK 到达，默认 2MSL。',
        checklist: ['能说握手挥手', '能说可靠机制'],
        tags: ['网络', 'TCP'],
        readMinutes: 13,
      },
      {
        slug: 'net-http',
        title: 'HTTP 与 HTTPS',
        tier: 'core',
        difficulty: 'medium',
        summary: '版本差异与安全传输',
        points: [
          'HTTP1.1 持久连接，HTTP2 多路复用',
          'HTTPS = TLS 握手 + 对称加密',
          'GET/POST 语义差异',
        ],
        code: {
          lang: 'bash',
          body: `curl -i https://example.com
# HTTP/2 200
# content-type: text/html
# 查看 TLS 版本:
openssl s_client -connect example.com:443`,
        },
        note: 'HTTP3 基于 QUIC(UDP)，降低握手延迟。',
        checklist: ['能说版本差异', '能说 HTTPS 流程'],
        tags: ['网络', 'HTTP'],
        readMinutes: 10,
      },
      {
        slug: 'net-dns',
        title: 'DNS 与网络分层',
        tier: 'basic',
        difficulty: 'easy',
        summary: '域名解析与 OSI/TCP-IP 模型',
        points: [
          'DNS 递归+迭代查询，逐级解析',
          'TCP/IP 四层 vs OSI 七层',
          'ARP 解析 IP 到 MAC',
        ],
        code: {
          lang: 'bash',
          body: `dig example.com +trace
# 查看本地 DNS 缓存与解析路径
nslookup example.com`,
        },
        note: 'DNS 劫持与缓存污染是常见安全问题。',
        checklist: ['能说解析流程', '能说分层'],
        tags: ['网络', 'DNS'],
        readMinutes: 8,
      },
      {
        slug: 'os-schedule',
        title: '进程调度',
        tier: 'core',
        difficulty: 'medium',
        summary: '调度算法与上下文切换',
        points: [
          'FCFS/SJF/RR/优先级/多级反馈队列',
          '上下文切换保存寄存器与状态',
          '抢占式 vs 非抢占式',
        ],
        code: {
          lang: 'plaintext',
          body: `RR(时间片轮转): 公平, 适合分时
多级反馈队列: 兼顾响应与吞吐
上下文切换: 保存/恢复寄存器与 PCB`,
        },
        note: '时间片过小切换开销大，过大退化为 FCFS。',
        checklist: ['能列算法', '能说上下文切换'],
        tags: ['OS', '调度'],
        readMinutes: 9,
      },
    ],
    cases: [
      {
        slug: 'case-tcp-server',
        title: '手写简易 TCP 回显服务',
        tier: 'key',
        difficulty: 'medium',
        summary: '理解 socket 编程与连接生命周期',
        points: [
          'server socket bind/listen/accept',
          'client connect/send/recv',
          '理解阻塞 IO 与连接管理',
        ],
        code: {
          lang: 'bash',
          body: `# 用 nc 验证回显服务
nc -l 8080            # 服务端监听
# 另开终端
nc localhost 8080     # 客户端连接`,
        },
        checklist: ['理解 socket 流程', '能解释三次握手'],
        readMinutes: 14,
      },
      {
        slug: 'case-deadlock',
        title: '死锁分析与避免',
        tier: 'key',
        difficulty: 'hard',
        summary: '给定资源分配图判断是否死锁',
        points: [
          '检查四个必要条件',
          '银行家算法判断安全序列',
          '资源分配图化简',
        ],
        code: {
          lang: 'plaintext',
          body: `Allocation  Need  Available
  P0: 0 1   7 4    3 3
  P1: 2 0   1 2
安全序列示例: P1 -> P0 (可全部完成)`,
        },
        checklist: ['能画资源图', '能求安全序列'],
        readMinutes: 16,
      },
    ],
  },

  {
    id: 'iv-mysql',
    name: 'MySQL 面试',
    tier: 'key',
    difficulty: 'hard',
    chapters: [
      {
        slug: 'mysql-index',
        title: '索引原理',
        tier: 'key',
        difficulty: 'hard',
        summary: 'B+ 树、聚簇索引与最左前缀',
        points: [
          'InnoDB 聚簇索引叶子存整行，二级索引存主键',
          'B+ 树多路平衡，矮胖适合磁盘',
          '最左前缀原则、覆盖索引、回表',
        ],
        code: {
          lang: 'sql',
          body: `EXPLAIN SELECT * FROM user
WHERE name = 'a' AND age > 18;
-- 联合索引 (name, age) 可命中`,
        },
        note: '索引失效：函数/隐式转换/前导模糊。',
        checklist: ['能说 B+ 树', '能说最左前缀'],
        tags: ['MySQL', '索引'],
        readMinutes: 13,
      },
      {
        slug: 'mysql-txn',
        title: '事务与隔离级别',
        tier: 'key',
        difficulty: 'hard',
        summary: 'ACID 与脏读/不可重复读/幻读',
        points: [
          '隔离级别：读未提交/读已提交/可重复读/串行',
          '可重复读默认级别，靠 MVCC 实现',
          'RR 下幻读由间隙锁解决',
        ],
        code: {
          lang: 'sql',
          body: `SET TRANSACTION ISOLATION LEVEL REPEATABLE READ;
START TRANSACTION;
SELECT * FROM t WHERE id = 1;
COMMIT;`,
        },
        note: 'MVCC 通过 undo log 与 ReadView 实现快照读。',
        checklist: ['能说四个级别', '能说 MVCC'],
        tags: ['MySQL', '事务'],
        readMinutes: 12,
      },
      {
        slug: 'mysql-lock',
        title: '锁机制',
        tier: 'key',
        difficulty: 'hard',
        summary: '行锁、间隙锁与 Next-Key Lock',
        points: [
          'Record Lock/ Gap Lock / Next-Key Lock',
          'Next-Key = 记录锁 + 间隙锁，防幻读',
          '死锁检测与回滚',
        ],
        code: {
          lang: 'sql',
          body: `SELECT * FROM t WHERE id = 5 FOR UPDATE;
-- 加行锁(记录存在), 否则退化为间隙锁`,
        },
        note: '无索引的更新会升级为表锁。',
        checklist: ['能说三类锁', '能说死锁处理'],
        tags: ['MySQL', '锁'],
        readMinutes: 12,
      },
      {
        slug: 'mysql-slow',
        title: '慢查询优化',
        tier: 'key',
        difficulty: 'hard',
        summary: '执行计划与优化思路',
        points: [
          '慢查询日志 + EXPLAIN 分析',
          '关注 type、rows、Extra',
          '避免 SELECT *、大分页、深分页',
        ],
        code: {
          lang: 'sql',
          body: `SELECT * FROM orders
WHERE user_id = 1
ORDER BY id DESC
LIMIT 100000, 10;  -- 深分页慢

-- 优化: 游标分页
SELECT * FROM orders
WHERE id < 1000000
ORDER BY id DESC LIMIT 10;`,
        },
        note: 'type 从 ALL 到 const 越优。',
        checklist: ['会读 EXPLAIN', '能优化慢 SQL'],
        tags: ['MySQL', '优化'],
        readMinutes: 14,
      },
      {
        slug: 'mysql-log',
        title: '日志与 binlog',
        tier: 'core',
        difficulty: 'medium',
        summary: 'redo/undo/binlog 与两阶段提交',
        points: [
          'redo log 保证持久性，Crash Safe',
          'undo log 支持回滚与 MVCC',
          'binlog 用于主从复制与恢复',
          '两阶段提交保证一致性',
        ],
        code: {
          lang: 'sql',
          body: `SHOW VARIABLES LIKE 'log_bin';
SHOW BINARY LOGS;
-- 主从基于 binlog 位点/GTID 复制`,
        },
        note: 'WAL：先写日志再写磁盘。',
        checklist: ['能说三类日志', '能说两阶段提交'],
        tags: ['MySQL', '日志'],
        readMinutes: 11,
      },
      {
        slug: 'mysql-engine',
        title: '存储引擎',
        tier: 'basic',
        difficulty: 'easy',
        summary: 'InnoDB 与 MyISAM 对比',
        points: [
          'InnoDB 支持事务/行锁/外键/聚簇索引',
          'MyISAM 表锁、读快、无事务',
          'Memory 引擎数据在内存',
        ],
        code: {
          lang: 'sql',
          body: `CREATE TABLE t (
  id INT PRIMARY KEY
) ENGINE=InnoDB;`,
        },
        note: 'MySQL 5.5 起默认 InnoDB。',
        checklist: ['能对比引擎', '能选引擎'],
        tags: ['MySQL', '引擎'],
        readMinutes: 8,
      },
      {
        slug: 'mysql-design',
        title: '表设计与范式',
        tier: 'core',
        difficulty: 'medium',
        summary: '三大范式与反范式权衡',
        points: [
          '1NF 原子性、2NF 消除部分依赖、3NF 消除传递依赖',
          '适当冗余减少 JOIN，提升读性能',
          '字段类型越小越优，避免过度设计',
        ],
        code: {
          lang: 'sql',
          body: `CREATE TABLE order_item (
  id BIGINT PRIMARY KEY,
  order_id BIGINT NOT NULL,
  sku VARCHAR(64),
  qty INT,
  INDEX (order_id)
);`,
        },
        note: '反范式以空间换时间，需保证一致性。',
        checklist: ['能说范式', '能做权衡'],
        tags: ['MySQL', '设计'],
        readMinutes: 10,
      },
    ],
    cases: [
      {
        slug: 'case-sharding',
        title: '设计分库分表方案',
        tier: 'key',
        difficulty: 'hard',
        summary: '按 user_id 哈希分片并规避热点',
        points: [
          '分片键选择、路由规则',
          '全局唯一 ID(snowflake/号段)',
          '跨分片聚合与迁移方案',
        ],
        code: {
          lang: 'sql',
          body: `-- 按 user_id % 16 路由到 16 个库
SELECT * FROM order_\${user_id % 16}
WHERE user_id = ?;
-- 全局 ID: 雪花算法 时间戳+机器+序列`,
        },
        checklist: ['分片键合理', 'ID 方案可行'],
        readMinutes: 18,
      },
      {
        slug: 'case-highconcurrency',
        title: '超高并发扣减库存',
        tier: 'key',
        difficulty: 'hard',
        summary: '乐观锁/行锁防止超卖',
        points: [
          'UPDATE ... SET stock=stock-1 WHERE stock>0',
          '乐观锁版本号防超卖',
          'Redis 预扣 + 异步落库',
        ],
        code: {
          lang: 'sql',
          body: `UPDATE item
SET stock = stock - 1
WHERE id = ? AND stock > 0;
-- 受影响行数=1 表示扣减成功`,
        },
        checklist: ['防超卖正确', '能说优化'],
        readMinutes: 16,
      },
    ],
  },

  {
    id: 'iv-redis',
    name: 'Redis 面试',
    tier: 'key',
    difficulty: 'hard',
    chapters: [
      {
        slug: 'redis-ds',
        title: '数据结构',
        tier: 'core',
        difficulty: 'medium',
        summary: '五种基本类型与底层编码',
        points: [
          'String/Hash/List/Set/ZSet',
          '底层：SDS、ziplist、skiplist、intset',
          'ZSet 用跳表+字典，范围查询高效',
        ],
        code: {
          lang: 'bash',
          body: `SET k v
HSET user:1 name tom age 18
ZADD rank 90 alice 85 bob
ZRANGE rank 0 -1 WITHSCORES`,
        },
        note: '小数据用 ziplist 省内存，超过阈值转哈希表。',
        checklist: ['能说类型', '能说底层'],
        tags: ['Redis', '数据结构'],
        readMinutes: 11,
      },
      {
        slug: 'redis-persist',
        title: '持久化',
        tier: 'key',
        difficulty: 'hard',
        summary: 'RDB 与 AOF 对比',
        points: [
          'RDB 快照，恢复快，可能丢数据',
          'AOF 追加命令，可配置 everysec',
          '混合持久化兼顾速度与安全',
        ],
        code: {
          lang: 'bash',
          body: `appendonly yes
appendfsync everysec
save 900 1      # 900s 内 1 次修改则快照
save 300 10`,
        },
        note: 'AOF 重写压缩历史命令。',
        checklist: ['能对比 RDB/AOF', '能说混合'],
        tags: ['Redis', '持久化'],
        readMinutes: 12,
      },
      {
        slug: 'redis-cache',
        title: '缓存问题与解决',
        tier: 'key',
        difficulty: 'hard',
        summary: '穿透/击穿/雪崩与一致性',
        points: [
          '穿透：布隆过滤器/空值缓存',
          '击穿：互斥锁/逻辑过期',
          '雪崩：随机过期 + 多级缓存',
        ],
        code: {
          lang: 'bash',
          body: `# 设置随机过期时间避免雪崩
SET k v EX 3600
PEXPIRE k 3600000 + rand(0, 600000)

# 布隆过滤器阻挡非法 key
BF.ADD blocked user:99999`,
        },
        note: '缓存与 DB 一致性：先更新 DB 再删缓存(延迟双删)。',
        checklist: ['能说三大问题', '能说一致性'],
        tags: ['Redis', '缓存'],
        readMinutes: 14,
      },
      {
        slug: 'redis-ha',
        title: '高可用架构',
        tier: 'key',
        difficulty: 'hard',
        summary: '主从、哨兵与集群',
        points: [
          '主从复制：全量 + 增量同步',
          '哨兵监控与自动故障转移',
          'Cluster 分槽(16384)实现水平扩展',
        ],
        code: {
          lang: 'bash',
          body: `redis-cli --cluster create \\
  127.0.0.1:7000 127.0.0.1:7001 127.0.0.1:7002 \\
  --cluster-replicas 1

SENTINEL monitor mymaster 127.0.0.1 6379 2`,
        },
        note: 'Cluster 模式下多 key 操作需注意槽位。',
        checklist: ['能说主从哨兵', '能说集群分槽'],
        tags: ['Redis', '高可用'],
        readMinutes: 13,
      },
      {
        slug: 'redis-expiry',
        title: '过期删除策略',
        tier: 'core',
        difficulty: 'medium',
        summary: '惰性删除与定期删除',
        points: [
          '惰性：访问时检查过期',
          '定期：随机抽取部分 key 删除',
          '内存淘汰：LRU/LFU/Random/TTL',
        ],
        code: {
          lang: 'bash',
          body: `maxmemory 2gb
maxmemory-policy allkeys-lru
TTL k
EXPIRE k 60`,
        },
        note: 'LFU 比 LRU 更能反映访问频率。',
        checklist: ['能说删除策略', '能说淘汰策略'],
        tags: ['Redis', '过期'],
        readMinutes: 10,
      },
      {
        slug: 'redis-atomic',
        title: '原子操作与 Lua',
        tier: 'core',
        difficulty: 'medium',
        summary: '事务、CAS 与 Lua 脚本',
        points: [
          '单命令原子；MULTI/EXEC 非严格事务',
          'WATCH 实现乐观锁',
          'Lua 脚本保证复杂操作原子性',
        ],
        code: {
          lang: 'bash',
          body: `WATCH balance
MULTI
DECRBY balance 10
EXEC

-- Lua 原子限流
EVAL "local c=redis.call('INCR',KEYS[1]) if c==1 then redis.call('EXPIRE',KEYS[1],1) end return c" 1 rl:ip`,
        },
        note: 'Redis 事务不支持回滚，失败仅报错。',
        checklist: ['能说事务', '能写 Lua'],
        tags: ['Redis', '原子'],
        readMinutes: 12,
      },
      {
        slug: 'redis-distlock',
        title: '分布式锁',
        tier: 'key',
        difficulty: 'hard',
        summary: 'SET NX 与 Redlock 探讨',
        points: [
          'SET key val NX PX 实现互斥',
          '需唯一 value 防误删，Lua 释放',
          'Redlock 多节点提升可靠性',
        ],
        code: {
          lang: 'bash',
          body: `SET lock:order  uuid NX PX 30000
-- 释放(校验 value 后删)
EVAL "if redis.call('GET',KEYS[1])==ARGV[1] then return redis.call('DEL',KEYS[1]) else return 0 end" 1 lock:order uuid`,
        },
        note: '锁需设置看门狗自动续期，防业务超时。',
        checklist: ['能实现锁', '能说释放安全'],
        tags: ['Redis', '分布式锁'],
        readMinutes: 13,
      },
    ],
    cases: [
      {
        slug: 'case-ratelimit',
        title: '手写分布式限流',
        tier: 'key',
        difficulty: 'hard',
        summary: '基于 Redis 的滑动窗口/令牌桶限流',
        points: [
          '计数器 + TTL 简易限流',
          'Lua 保证原子性',
          '滑动窗口比固定窗口更平滑',
        ],
        code: {
          lang: 'bash',
          body: `EVAL "local n=redis.call('INCR',KEYS[1]) if n==1 then redis.call('EXPIRE',KEYS[1],ARGV[1]) end if n>tonumber(ARGV[2]) then return 0 end return 1" 1 limit:ip 1 100`,
        },
        checklist: ['原子性正确', '限流维度合理'],
        readMinutes: 16,
      },
      {
        slug: 'case-shorturl',
        title: '设计短链系统',
        tier: 'key',
        difficulty: 'hard',
        summary: '发号器 + Redis 缓存 + 跳转',
        points: [
          '长链哈希/发号器生成短码',
          'Redis 缓存热点映射',
          '302 重定向返回原链',
        ],
        code: {
          lang: 'bash',
          body: `# 查询短码，命中缓存则直接跳转
GET short:Ab3x9
# 未命中回源数据库并回填
SET short:Ab3x9 https://origin.long/url EX 86400`,
        },
        checklist: ['发号方案可行', '缓存命中率高'],
        readMinutes: 18,
      },
    ],
  },

  {
    id: 'iv-spring',
    name: 'Spring 面试',
    tier: 'key',
    difficulty: 'hard',
    chapters: [
      {
        slug: 'spring-ioc',
        title: 'IoC 容器',
        tier: 'core',
        difficulty: 'medium',
        summary: '容器、BeanFactory 与依赖注入',
        points: [
          'IoC 控制反转，DI 实现依赖注入',
          'BeanFactory 延迟加载，ApplicationContext 增强',
          '注入方式：构造器/setter/字段(@Autowired)',
        ],
        code: {
          lang: 'java',
          body: `@Configuration
public class AppConfig {
    @Bean
    public UserService userService() {
        return new UserService();
    }
}`,
        },
        note: '构造器注入利于不可变与测试。',
        checklist: ['能说 IoC/DI', '能说容器区别'],
        tags: ['Spring', 'IoC'],
        readMinutes: 10,
      },
      {
        slug: 'spring-aop',
        title: 'AOP 面向切面',
        tier: 'key',
        difficulty: 'hard',
        summary: '代理、切点表达式与通知',
        points: [
          'JDK 动态代理(接口) vs CGLIB(类)',
          '通知：Before/After/AfterReturning/Around/AfterThrowing',
          '切点表达式 execution/annotation',
        ],
        code: {
          lang: 'java',
          body: `@Aspect
@Component
public class LogAspect {
    @Around("execution(* com.x..*(..))")
    public Object around(ProceedingJoinPoint p) throws Throwable {
        long s = System.nanoTime();
        Object r = p.proceed();
        System.out.println(System.nanoTime() - s);
        return r;
    }
}`,
        },
        note: '同一类内方法互调不走代理，AOP 不生效。',
        checklist: ['能说两种代理', '能写切面'],
        tags: ['Spring', 'AOP'],
        readMinutes: 13,
      },
      {
        slug: 'spring-cycle',
        title: '循环依赖',
        tier: 'key',
        difficulty: 'hard',
        summary: '三级缓存与解决机制',
        points: [
          '三级缓存：单例池/早期曝光/工厂',
          '提前曝光半成品 bean 打破循环',
          '构造器注入无法解决循环依赖',
        ],
        code: {
          lang: 'java',
          body: `@Service
public class A { @Autowired private B b; }
@Service
public class B { @Autowired private A a; }
// 字段注入可经三级缓存解决`,
        },
        note: 'singleton 字段/setter 循环可解，prototype 不可。',
        checklist: ['能说三级缓存', '能说限制'],
        tags: ['Spring', '循环依赖'],
        readMinutes: 12,
      },
      {
        slug: 'spring-tx',
        title: '事务传播',
        tier: 'key',
        difficulty: 'hard',
        summary: '七种传播行为与失效场景',
        points: [
          'REQUIRED/REQUIRES_NEW/NESTED 等七种',
          '同类方法调用事务不生效(代理未介入)',
          'RuntimeException 默认回滚',
        ],
        code: {
          lang: 'java',
          body: `@Transactional(propagation = Propagation.REQUIRES_NEW)
public void audit() { /* 新事务 */ }

@Transactional
public void pay() { audit(); } // 同类调用不生效`,
        },
        note: '事务方法须是 public 且经代理调用。',
        checklist: ['能说传播行为', '能说失效场景'],
        tags: ['Spring', '事务'],
        readMinutes: 13,
      },
      {
        slug: 'spring-mvc',
        title: 'Spring MVC 流程',
        tier: 'core',
        difficulty: 'medium',
        summary: '请求处理链路与核心组件',
        points: [
          'DispatcherServlet 统一分发',
          'HandlerMapping/HandlerAdapter/ViewResolver',
          '拦截器 vs 过滤器执行顺序',
        ],
        code: {
          lang: 'java',
          body: `@RestController
public class C {
    @GetMapping("/u/{id}")
    public User get(@PathVariable Long id) {
        return service.find(id);
    }
}`,
        },
        note: '拦截器基于 Handler，过滤器基于 Servlet。',
        checklist: ['能说处理流程', '能说拦截器区别'],
        tags: ['Spring', 'MVC'],
        readMinutes: 11,
      },
      {
        slug: 'spring-boot',
        title: 'Spring Boot 自动配置',
        tier: 'core',
        difficulty: 'medium',
        summary: '起步依赖与条件装配',
        points: [
          '@SpringBootApplication 复合注解',
          'spring.factories / AutoConfiguration 自动装配',
          '@Conditional 系列控制装配条件',
        ],
        code: {
          lang: 'java',
          body: `@SpringBootApplication
public class App {
    public static void main(String[] a) {
        SpringApplication.run(App.class, a);
    }
}`,
        },
        note: '自动配置按 classpath 条件按需加载。',
        checklist: ['能说自动配置', '能说条件注解'],
        tags: ['Spring', 'Boot'],
        readMinutes: 10,
      },
      {
        slug: 'spring-beanlife',
        title: 'Bean 生命周期',
        tier: 'extra',
        difficulty: 'hard',
        summary: '初始化回调与销毁',
        points: [
          'Aware 接口注入容器资源',
          'BeanPostProcessor 介入前后处理',
          '@PostConstruct / DisposableBean',
        ],
        code: {
          lang: 'java',
          body: `@Component
public class Demo implements InitializingBean {
    @PostConstruct
    void init() { System.out.println("init"); }
    public void afterPropertiesSet() {}
}`,
        },
        note: 'BeanPostProcessor 是许多注解功能的基础。',
        checklist: ['能说生命周期', '能说后置处理器'],
        tags: ['Spring', '生命周期'],
        readMinutes: 12,
      },
    ],
    cases: [
      {
        slug: 'case-tx-design',
        title: '设计多数据源事务方案',
        tier: 'key',
        difficulty: 'hard',
        summary: '本地事务局限与分布式事务取舍',
        points: [
          '单库用 @Transactional 即可',
          '多库考虑 2PC/TCC/最终一致(消息)',
          'Seata AT 模式无侵入',
        ],
        code: {
          lang: 'java',
          body: `@Transactional
public void transfer() {
    accountMapper.debit();   // 库A
    // 跨库需分布式事务
    orderMapper.create();    // 库B
}`,
        },
        checklist: ['能识别跨库', '能说方案'],
        readMinutes: 16,
      },
      {
        slug: 'case-ioc-ext',
        title: '扩展 IoC 容器',
        tier: 'key',
        difficulty: 'hard',
        summary: '自定义 BeanPostProcessor 实现统一处理',
        points: [
          '实现 BeanPostProcessor 拦截 bean',
          '可用于日志/校验/注解增强',
          '注意执行顺序与性能',
        ],
        code: {
          lang: 'java',
          body: `@Component
public class TraceProcessor implements BeanPostProcessor {
    public Object postProcessAfterInitialization(Object b, String n) {
        if (b instanceof Traceable) System.out.println("trace:" + n);
        return b;
    }
}`,
        },
        checklist: ['能写后置处理器', '能说应用场景'],
        readMinutes: 14,
      },
    ],
  },
];
