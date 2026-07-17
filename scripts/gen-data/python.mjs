export default [
  {
    id: 'py-basics',
    name: 'Python 基础语法',
    tier: 'core',
    difficulty: 'easy',
    chapters: [
      {
        slug: 'env',
        title: '环境与第一个程序',
        tier: 'basic',
        difficulty: 'easy',
        summary: '搭建 Python 运行环境并运行第一段代码',
        intro: 'Python 以简洁著称，先装好解释器再敲下第一行代码。',
        points: [
          '安装 Python 3.10+ 并配置 PATH',
          '使用 python / python3 命令运行脚本',
          '认识 REPL 交互式解释器',
          '用 print() 输出内容',
          '掌握 python -m venv 创建虚拟环境',
        ],
        code: {
          lang: 'bash',
          body: `python3 --version
python3 -m venv .venv
source .venv/bin/activate
python3 -c "print('hello')"`,
        },
        note: '建议每个项目独立虚拟环境，避免依赖冲突。',
        checklist: [
          '能打印出 hello',
          '成功创建并激活虚拟环境',
          '知道如何退出虚拟环境',
        ],
        tags: ['环境', 'venv'],
        readMinutes: 12,
      },
      {
        slug: 'vars-types',
        title: '变量与基本类型',
        tier: 'basic',
        difficulty: 'easy',
        summary: '理解变量、数字、字符串与布尔类型',
        points: [
          '变量无需声明类型，动态赋值',
          'int / float / bool / str 四种基础类型',
          '字符串支持 f-string 插值',
          'type() 查看对象类型',
          'None 表示空值',
        ],
        code: {
          lang: 'python',
          body: `name = "小明"
age = 18
score = 95.5
active = True
print(f"{name} 今年 {age} 岁，成绩 {score}")

from typing import Optional
x: Optional[int] = None`,
        },
        checklist: [
          '能区分 int 与 float',
          '会使用 f-string 格式化输出',
          '理解 None 的含义',
        ],
        readMinutes: 10,
      },
      {
        slug: 'control',
        title: '流程控制',
        tier: 'core',
        difficulty: 'easy',
        summary: 'if/for/while 控制程序走向',
        points: [
          'if / elif / else 条件分支',
          'for 遍历可迭代对象',
          'while 循环与 break/continue',
          'range() 生成数字序列',
          '缩进决定代码块归属',
        ],
        code: {
          lang: 'python',
          body: `for i in range(5):
    if i % 2 == 0:
        print(f"{i} 是偶数")
    else:
        continue

n = 0
while n < 3:
    print(n)
    n += 1`,
        },
        checklist: [
          '能用 for 输出 0-4',
          '理解 break 与 continue 区别',
          '代码缩进一致无报错',
        ],
        readMinutes: 11,
      },
      {
        slug: 'strings',
        title: '字符串处理',
        tier: 'core',
        difficulty: 'easy',
        summary: '切片、格式化与常用方法',
        points: [
          '切片 [start:end:step] 截取子串',
          'str.split() / join() 切分与拼接',
          'strip() 去除空白字符',
          'in 判断子串包含关系',
          'replace() 替换内容',
        ],
        code: {
          lang: 'python',
          body: `text = "  hello,world  "
parts = text.strip().split(",")
print(parts)
joined = "-".join(parts)
print(joined)

s = "python"
print(s[::-1])
print("py" in s)`,
        },
        checklist: [
          '能把逗号字符串拆成列表',
          '会反转字符串',
          '掌握 strip 去空格',
        ],
        readMinutes: 10,
      },
      {
        slug: 'collections',
        title: '容器类型',
        tier: 'core',
        difficulty: 'medium',
        summary: '列表、元组、字典与集合',
        points: [
          'list 可变有序序列',
          'tuple 不可变有序序列',
          'dict 键值映射，3.7+ 保序',
          'set 去重与集合运算',
          '推导式快速生成容器',
        ],
        code: {
          lang: 'python',
          body: `nums = [1, 2, 3, 2]
squares = [n * n for n in nums]
unique = set(nums)
d = {"a": 1, "b": 2}
print(squares, unique, d.get("a"))`,
        },
        checklist: [
          '会写列表推导式',
          '理解 list 与 tuple 区别',
          '用 set 去重',
        ],
        readMinutes: 13,
      },
      {
        slug: 'functions',
        title: '函数定义',
        tier: 'core',
        difficulty: 'medium',
        summary: '参数、返回值与默认参数',
        points: [
          'def 定义函数，return 返回',
          '位置参数与关键字参数',
          '默认参数与可变参数 *args/**kwargs',
          '文档字符串 docstring',
          '变量作用域 LEGB 规则',
        ],
        code: {
          lang: 'python',
          body: `def greet(name, greeting="你好"):
    """返回问候语"""
    return f"{greeting}, {name}!"

def total(*nums):
    return sum(nums)

print(greet("小红"))
print(total(1, 2, 3))`,
        },
        note: '默认参数不要使用可变对象，如 list 会有共享陷阱。',
        checklist: [
          '能定义带默认参数的函数',
          '会用 *args 接收变长参数',
          '写出可读 docstring',
        ],
        readMinutes: 14,
      },
      {
        slug: 'io',
        title: '文件读写',
        tier: 'key',
        difficulty: 'medium',
        summary: 'with 上下文管理器安全读写文件',
        points: [
          'open() 打开文件，with 自动关闭',
          'r/w/a 读写追加模式',
          'read() / readlines() / write()',
          'encoding="utf-8" 指定编码',
          'pathlib 更现代的路径操作',
        ],
        code: {
          lang: 'python',
          body: `from pathlib import Path

p = Path("data.txt")
p.write_text("第一行\n第二行", encoding="utf-8")
for line in p.read_text(encoding="utf-8").splitlines():
    print(line)`,
        },
        checklist: [
          '用 with 读写文件不漏关',
          '能按行读取文本',
          '理解 utf-8 编码',
        ],
        readMinutes: 12,
      },
    ],
    cases: [
      {
        slug: 'case-calc',
        title: '命令行计算器',
        tier: 'basic',
        difficulty: 'easy',
        summary: '实现一个支持四则运算的小工具',
        points: [
          '接收用户输入两个数字与运算符',
          '用 if/elif 分发计算逻辑',
          '处理除零等异常输入',
          '循环交互直到退出',
        ],
        code: {
          lang: 'python',
          body: `def calc(a, b, op):
    if op == "+":
        return a + b
    if op == "-":
        return a - b
    if op == "*":
        return a * b
    if op == "/":
        return a / b if b != 0 else None
    return None

print(calc(3, 4, "+"))`,
        },
        checklist: [
          '能正确计算加减乘除',
          '除零时返回 None 不崩溃',
        ],
        readMinutes: 20,
      },
    ],
  },

  {
    id: 'py-oop',
    name: '面向对象',
    tier: 'core',
    difficulty: 'medium',
    chapters: [
      {
        slug: 'class',
        title: '类与对象',
        tier: 'basic',
        difficulty: 'easy',
        summary: '用 class 封装数据与行为',
        points: [
          'class 定义类，__init__ 初始化',
          'self 指向实例自身',
          '实例属性与方法',
          '用对象组织相关数据',
        ],
        code: {
          lang: 'python',
          body: `class Dog:
    def __init__(self, name):
        self.name = name

    def bark(self):
        return f"{self.name}: 汪汪"

d = Dog("阿黄")
print(d.bark())`,
        },
        checklist: ['能定义类并创建实例', '理解 self 作用'],
        readMinutes: 11,
      },
      {
        slug: 'methods',
        title: '实例、类与静态方法',
        tier: 'core',
        difficulty: 'easy',
        summary: '区分三种方法装饰器',
        points: [
          '@staticmethod 无 self',
          '@classmethod 首个参数为 cls',
          '实例方法访问 self',
          '何时使用类方法创建工厂',
        ],
        code: {
          lang: 'python',
          body: `class Tool:
    @staticmethod
    def add(a, b):
        return a + b

    @classmethod
    def make(cls, x):
        return cls(x)

print(Tool.add(1, 2))`,
        },
        checklist: ['会用 staticmethod', '理解 classmethod 的 cls'],
        readMinutes: 10,
      },
      {
        slug: 'inheritance',
        title: '继承与多态',
        tier: 'core',
        difficulty: 'medium',
        summary: '子类复用并扩展父类',
        points: [
          'class Child(Parent) 继承',
          'super() 调用父类方法',
          '方法重写实现多态',
          'isinstance() 类型判断',
        ],
        code: {
          lang: 'python',
          body: `class Animal:
    def speak(self):
        return "..."

class Cat(Animal):
    def speak(self):
        return "喵"

print(Cat().speak())
print(isinstance(Cat(), Animal))`,
        },
        checklist: ['能实现子类重写', '理解 super()', '用 isinstance 判断类型'],
        readMinutes: 13,
      },
      {
        slug: 'dunder',
        title: '特殊方法 (dunder)',
        tier: 'key',
        difficulty: 'medium',
        summary: '自定义对象的运算符与表现',
        points: [
          '__str__ / __repr__ 显示',
          '__len__ / __getitem__ 容器协议',
          '__eq__ 等值比较',
          '__call__ 使实例可调用',
        ],
        code: {
          lang: 'python',
          body: `class Point:
    def __init__(self, x, y):
        self.x, self.y = x, y

    def __repr__(self):
        return f"Point({self.x},{self.y})"

    def __add__(self, other):
        return Point(self.x + other.x, self.y + other.y)

print(Point(1, 2) + Point(3, 4))`,
        },
        note: '优先实现 __repr__，__str__ 缺省回退到它。',
        checklist: ['自定义 __repr__', '实现运算符重载'],
        readMinutes: 14,
      },
      {
        slug: 'property',
        title: '属性与描述符',
        tier: 'key',
        difficulty: 'medium',
        summary: '用 property 控制访问',
        points: [
          '@property 只读属性',
          'setter / deleter 控制写入',
          '惰性属性缓存',
          '描述符协议进阶',
        ],
        code: {
          lang: 'python',
          body: `class Circle:
    def __init__(self, r):
        self.r = r

    @property
    def area(self):
        return 3.14159 * self.r ** 2

c = Circle(2)
print(c.area)`,
        },
        checklist: ['用 property 暴露计算属性', '理解 getter/setter'],
        readMinutes: 12,
      },
      {
        slug: 'slots',
        title: '__slots__ 与性能',
        tier: 'extra',
        difficulty: 'hard',
        summary: '限制属性节省内存',
        points: [
          '__slots__ 禁止动态属性',
          '显著减少实例内存占用',
          '适用大量实例场景',
          '会与某些特性冲突',
        ],
        code: {
          lang: 'python',
          body: `class Point:
    __slots__ = ("x", "y")
    def __init__(self, x, y):
        self.x, self.y = x, y

p = Point(1, 2)
print(p.x)`,
        },
        checklist: ['用 __slots__ 定义类', '理解其内存收益'],
        readMinutes: 11,
      },
      {
        slug: 'dataclass',
        title: 'dataclasses 与枚举',
        tier: 'core',
        difficulty: 'medium',
        summary: '简化数据类与枚举定义',
        points: [
          '@dataclass 自动生成方法',
          'field() 定制字段',
          'Enum 定义有限集合',
          'frozen 不可变数据类',
        ],
        code: {
          lang: 'python',
          body: `from dataclasses import dataclass
from enum import Enum

class Color(Enum):
    RED = 1
    GREEN = 2

@dataclass
class User:
    name: str
    age: int

print(User("tom", 20), Color.RED)`,
        },
        checklist: ['用 dataclass 定义数据类', '用 Enum 约束取值'],
        readMinutes: 13,
      },
    ],
    cases: [
      {
        slug: 'case-bank',
        title: '银行账户系统',
        tier: 'core',
        difficulty: 'medium',
        summary: '用 OOP 建模账户与交易',
        points: [
          'Account 类管理余额',
          'deposit/withdraw 方法',
          '继承出储蓄账户子类',
          '用 property 校验余额',
        ],
        code: {
          lang: 'python',
          body: `class Account:
    def __init__(self, owner, balance=0):
        self.owner = owner
        self._balance = balance

    @property
    def balance(self):
        return self._balance

    def deposit(self, amount):
        if amount > 0:
            self._balance += amount

a = Account("小红")
a.deposit(100)
print(a.balance)`,
        },
        checklist: ['能存款取款', '余额不为负'],
        readMinutes: 25,
      },
    ],
  },

  {
    id: 'py-dsa',
    name: '数据结构与算法',
    tier: 'key',
    difficulty: 'hard',
    chapters: [
      {
        slug: 'complexity',
        title: '复杂度分析',
        tier: 'basic',
        difficulty: 'medium',
        summary: '用大 O 衡量效率',
        points: [
          '时间复杂度与空间复杂度',
          '常见 O(1)/O(n)/O(n log n)',
          '最坏与平均情况',
          '用 cProfile 实测',
        ],
        code: {
          lang: 'python',
          body: `import cProfile

def loop(n):
    return sum(range(n))

cProfile.run("loop(100000)")`,
        },
        checklist: ['能判断循环复杂度', '会用 cProfile'],
        readMinutes: 12,
      },
      {
        slug: 'array-list',
        title: '数组与链表',
        tier: 'core',
        difficulty: 'medium',
        summary: 'list 底层与手写链表',
        points: [
          'list 动态数组的扩容',
          'append/pop 的均摊复杂度',
          '手写单向链表节点',
          '插入删除的差异',
        ],
        code: {
          lang: 'python',
          body: `class Node:
    def __init__(self, val, nxt=None):
        self.val = val
        self.next = nxt

head = Node(1, Node(2, Node(3)))
cur = head
while cur:
    print(cur.val)
    cur = cur.next`,
        },
        checklist: ['手写链表遍历', '理解 list 扩容'],
        readMinutes: 14,
      },
      {
        slug: 'stack-queue',
        title: '栈与队列',
        tier: 'core',
        difficulty: 'medium',
        summary: '两种基础线性结构',
        points: [
          '栈 LIFO，用 list 实现',
          '队列 FIFO，用 deque',
          '括号匹配用栈',
          'BFS 用队列',
        ],
        code: {
          lang: 'python',
          body: `from collections import deque

q = deque()
q.append(1)
q.append(2)
print(q.popleft())

stack = []
stack.append("a")
print(stack.pop())`,
        },
        checklist: ['用 deque 实现队列', '用栈做括号匹配'],
        readMinutes: 12,
      },
      {
        slug: 'hash',
        title: '哈希表',
        tier: 'core',
        difficulty: 'medium',
        summary: 'dict 的哈希原理',
        points: [
          '哈希函数与桶',
          'dict 平均 O(1) 查找',
          '哈希冲突与链表法',
          '可哈希对象需实现 __hash__',
        ],
        code: {
          lang: 'python',
          body: `freq = {}
for ch in "abracadabra":
    freq[ch] = freq.get(ch, 0) + 1
print(freq)`,
        },
        checklist: ['统计字符频率', '理解哈希查找'],
        readMinutes: 12,
      },
      {
        slug: 'tree',
        title: '树与二叉树',
        tier: 'key',
        difficulty: 'hard',
        summary: '递归遍历二叉树',
        points: [
          '节点与左右子树',
          '前序/中序/后序遍历',
          '递归与栈实现',
          '二叉搜索树性质',
        ],
        code: {
          lang: 'python',
          body: `class TNode:
    def __init__(self, v, l=None, r=None):
        self.v, self.l, self.r = v, l, r

def inorder(n):
    if not n:
        return []
    return inorder(n.l) + [n.v] + inorder(n.r)

root = TNode(2, TNode(1), TNode(3))
print(inorder(root))`,
        },
        checklist: ['实现中序遍历', '理解递归树'],
        readMinutes: 16,
      },
      {
        slug: 'sort',
        title: '排序算法',
        tier: 'key',
        difficulty: 'hard',
        summary: '快排与归并的实现',
        points: [
          '快速排序分治思想',
          '归并排序稳定 O(n log n)',
          '内置 sorted 的 TimSort',
          'key 参数自定义排序',
        ],
        code: {
          lang: 'python',
          body: `def quicksort(a):
    if len(a) <= 1:
        return a
    p = a[len(a) // 2]
    lo = [x for x in a if x < p]
    eq = [x for x in a if x == p]
    hi = [x for x in a if x > p]
    return quicksort(lo) + eq + quicksort(hi)

print(quicksort([3, 1, 2]))`,
        },
        checklist: ['手写快排', '会用 sorted(key=...)'],
        readMinutes: 15,
      },
      {
        slug: 'graph',
        title: '图与搜索',
        tier: 'extra',
        difficulty: 'hard',
        summary: '邻接表与 DFS/BFS',
        points: [
          '邻接表表示图',
          'DFS 深度优先',
          'BFS 广度优先',
          'visited 集合防环',
        ],
        code: {
          lang: 'python',
          body: `graph = {"a": ["b", "c"], "b": ["c"], "c": []}

def dfs(node, seen=None):
    seen = seen or set()
    seen.add(node)
    for nb in graph[node]:
        if nb not in seen:
            dfs(nb, seen)
    return seen

print(dfs("a"))`,
        },
        checklist: ['邻接表建图', '实现 DFS 遍历'],
        readMinutes: 16,
      },
    ],
    cases: [
      {
        slug: 'case-lru',
        title: 'LRU 缓存',
        tier: 'key',
        difficulty: 'hard',
        summary: '用 OrderedDict 实现最近最少使用',
        points: [
          'get/put 均为 O(1)',
          '命中后移到队首',
          '超容量淘汰队尾',
          '利用 OrderedDict.move_to_end',
        ],
        code: {
          lang: 'python',
          body: `from collections import OrderedDict

class LRU:
    def __init__(self, cap):
        self.cap, self.d = cap, OrderedDict()

    def get(self, k):
        if k not in self.d:
            return -1
        self.d.move_to_end(k)
        return self.d[k]

    def put(self, k, v):
        self.d[k] = v
        self.d.move_to_end(k)
        if len(self.d) > self.cap:
            self.d.popitem(last=False)`,
        },
        checklist: ['get/put O(1)', '正确淘汰最旧项'],
        readMinutes: 28,
      },
    ],
  },

  {
    id: 'py-fp',
    name: '函数式特性',
    tier: 'core',
    difficulty: 'medium',
    chapters: [
      {
        slug: 'first-class',
        title: '一等函数',
        tier: 'basic',
        difficulty: 'easy',
        summary: '函数可作变量传递',
        points: [
          '函数赋值给变量',
          '作为参数与返回值',
          '闭包捕获外部变量',
          '高阶函数 map/filter',
        ],
        code: {
          lang: 'python',
          body: `def make_adder(n):
    def adder(x):
        return x + n
    return adder

add5 = make_adder(5)
print(add5(10))`,
        },
        checklist: ['理解闭包', '函数可作返回值'],
        readMinutes: 11,
      },
      {
        slug: 'lambda',
        title: 'lambda 与内置函数',
        tier: 'core',
        difficulty: 'easy',
        summary: '匿名函数配合 map/reduce',
        points: [
          'lambda 单行表达式',
          'map/filter 转换序列',
          'functools.reduce 归约',
          'sorted(key=lambda)',
        ],
        code: {
          lang: 'python',
          body: `from functools import reduce

nums = [1, 2, 3, 4]
squares = list(map(lambda x: x * x, nums))
total = reduce(lambda a, b: a + b, nums)
print(squares, total)`,
        },
        checklist: ['用 map 映射', '用 reduce 求和'],
        readMinutes: 10,
      },
      {
        slug: 'comprehension',
        title: '推导式',
        tier: 'core',
        difficulty: 'easy',
        summary: '列表/字典/集合推导',
        points: [
          '列表推导 [x for x in ...]',
          '字典推导 {k: v for ...}',
          '集合推导去重',
          '带 if 条件过滤',
        ],
        code: {
          lang: 'python',
          body: `words = ["a", "bb", "ccc"]
d = {w: len(w) for w in words if len(w) > 1}
print(d)`,
        },
        checklist: ['写字典推导', '带条件过滤'],
        readMinutes: 9,
      },
      {
        slug: 'generator',
        title: '生成器',
        tier: 'key',
        difficulty: 'medium',
        summary: '惰性计算节省内存',
        points: [
          'yield 暂停并产出',
          '生成器表达式 (x for x in ...)',
          '节省大数据内存',
          'next() 逐项取值',
        ],
        code: {
          lang: 'python',
          body: `def count_up(n):
    i = 0
    while i < n:
        yield i
        i += 1

for v in count_up(3):
    print(v)`,
        },
        checklist: ['用 yield 写生成器', '理解惰性求值'],
        readMinutes: 12,
      },
      {
        slug: 'decorator',
        title: '装饰器',
        tier: 'key',
        difficulty: 'medium',
        summary: '增强函数行为',
        points: [
          '@decorator 语法糖',
          ' wraps 保留元信息',
          '计时/缓存装饰器',
          '带参装饰器三层嵌套',
        ],
        code: {
          lang: 'python',
          body: `import time
from functools import wraps

def timer(fn):
    @wraps(fn)
    def wrapper(*a, **k):
        t = time.time()
        r = fn(*a, **k)
        print(f"{fn.__name__} 用时 {time.time() - t:.3f}s")
        return r
    return wrapper

@timer
def work():
    return sum(range(100000))`,
        },
        note: '务必用 @wraps 保留原函数名与文档。',
        checklist: ['实现计时装饰器', '用 @wraps'],
        readMinutes: 14,
      },
      {
        slug: 'itertools',
        title: 'itertools 工具',
        tier: 'extra',
        difficulty: 'medium',
        summary: '高效迭代器组合',
        points: [
          'chain 串联多个迭代',
          'combinations/permutations',
          'groupby 分组',
          'islice 切片迭代',
        ],
        code: {
          lang: 'python',
          body: `from itertools import combinations

for c in combinations("ABC", 2):
    print(c)`,
        },
        checklist: ['用 combinations 取组合', '理解迭代器惰性'],
        readMinutes: 11,
      },
      {
        slug: 'partial',
        title: 'functools 进阶',
        tier: 'extra',
        difficulty: 'medium',
        summary: 'partial 与 lru_cache',
        points: [
          'partial 固定部分参数',
          'lru_cache 记忆化',
          '加速递归与重复计算',
          'cache 单参数简化版',
        ],
        code: {
          lang: 'python',
          body: `from functools import lru_cache, partial

@lru_cache(maxsize=None)
def fib(n):
    return n if n < 2 else fib(n - 1) + fib(n - 2)

pow2 = partial(pow, 2)
print(fib(30), pow2(10))`,
        },
        checklist: ['用 lru_cache 加速', '用 partial 偏应用'],
        readMinutes: 12,
      },
    ],
    cases: [
      {
        slug: 'case-pipe',
        title: '数据处理管道',
        tier: 'core',
        difficulty: 'medium',
        summary: '用函数式组合清洗数据',
        points: [
          'filter 过滤无效行',
          'map 转换字段',
          '生成器流式处理大文件',
          'compose 组合多个步骤',
        ],
        code: {
          lang: 'python',
          body: `lines = ["1", "", "3", "4"]
clean = filter(bool, lines)
nums = map(int, clean)
print(list(nums))`,
        },
        checklist: ['流式过滤转换', '避免一次性载入'],
        readMinutes: 22,
      },
    ],
  },

  {
    id: 'py-web',
    name: 'Web 开发 (Flask/FastAPI/Django/异步)',
    tier: 'key',
    difficulty: 'hard',
    chapters: [
      {
        slug: 'http-basics',
        title: 'HTTP 与请求模型',
        tier: 'basic',
        difficulty: 'easy',
        summary: '理解请求/响应与状态码',
        points: [
          '方法 GET/POST/PUT/DELETE',
          '状态码 2xx/3xx/4xx/5xx',
          '请求头与查询参数',
          'JSON 作为主流载荷',
        ],
        code: {
          lang: 'http',
          body: `GET /api/users?page=1 HTTP/1.1
Host: example.com
Accept: application/json

HTTP/1.1 200 OK
Content-Type: application/json

{"data": []}`,
        },
        checklist: ['说清 GET 与 POST', '认识常见状态码'],
        readMinutes: 10,
      },
      {
        slug: 'flask',
        title: 'Flask 快速入门',
        tier: 'core',
        difficulty: 'medium',
        summary: '轻量级路由与视图',
        points: [
          '@app.route 定义路由',
          'request 获取参数',
          'jsonify 返回 JSON',
          '蓝图组织模块',
        ],
        code: {
          lang: 'python',
          body: `from flask import Flask, request, jsonify

app = Flask(__name__)

@app.route("/hello", methods=["GET"])
def hello():
    name = request.args.get("name", "world")
    return jsonify(msg=f"hello {name}")`,
        },
        checklist: ['定义 GET 路由', '返回 JSON 响应'],
        readMinutes: 14,
      },
      {
        slug: 'fastapi',
        title: 'FastAPI 与类型',
        tier: 'core',
        difficulty: 'medium',
        summary: '类型注解驱动接口',
        points: [
          'FastAPI 基于类型生成文档',
          'Pydantic 校验请求体',
          '自动生成 OpenAPI/Swagger',
          '异步 async def 视图',
        ],
        code: {
          lang: 'python',
          body: `from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI()

class Item(BaseModel):
    name: str
    price: float

@app.post("/items")
def create(item: Item):
    return {"ok": True, "item": item.model_dump()}`,
        },
        checklist: ['用 Pydantic 校验', '访问 /docs 文档'],
        readMinutes: 15,
      },
      {
        slug: 'django',
        title: 'Django 全栈框架',
        tier: 'key',
        difficulty: 'hard',
        summary: 'ORM、视图与 MTV 架构',
        points: [
          'models 定义数据表',
          'ORM 查询 API',
          'views + urls 路由',
          'admin 后台开箱即用',
        ],
        code: {
          lang: 'python',
          body: `from django.db import models

class Article(models.Model):
    title = models.CharField(max_length=200)
    body = models.TextField()
    created = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title`,
        },
        note: '运行前需执行 migrate 建表。',
        checklist: ['定义 Django 模型', '用 ORM 查询'],
        readMinutes: 16,
      },
      {
        slug: 'orm',
        title: '数据库与 ORM',
        tier: 'core',
        difficulty: 'medium',
        summary: 'SQLAlchemy 核心用法',
        points: [
          'engine/session 管理连接',
          '声明式模型定义',
          'query 增删改查',
          '迁移工具 alembic',
        ],
        code: {
          lang: 'python',
          body: `from sqlalchemy import Column, Integer, String, create_engine
from sqlalchemy.orm import declarative_base, Session

Base = declarative_base()
engine = create_engine("sqlite:///app.db")

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True)
    name = Column(String)

Base.metadata.create_all(engine)`,
        },
        checklist: ['创建引擎与模型', '理解 session'],
        readMinutes: 15,
      },
      {
        slug: 'auth',
        title: '认证与鉴权',
        tier: 'key',
        difficulty: 'hard',
        summary: 'JWT 与会话管理',
        points: [
          '密码哈希用 bcrypt',
          'JWT 无状态令牌',
          '依赖注入校验权限',
          'CSRF/CORS 基础防护',
        ],
        code: {
          lang: 'python',
          body: `import jwt

token = jwt.encode({"uid": 1}, "secret", algorithm="HS256")
payload = jwt.decode(token, "secret", algorithms=["HS256"])
print(payload)`,
        },
        note: '密钥应放在环境变量，切勿硬编码。',
        checklist: ['签发与校验 JWT', '密码做哈希'],
        readMinutes: 16,
      },
      {
        slug: 'deploy',
        title: '部署与 ASGI',
        tier: 'extra',
        difficulty: 'hard',
        summary: 'Gunicorn/Uvicorn 上线',
        points: [
          'WSGI 与 ASGI 区别',
          'uvicorn 跑异步应用',
          'gunicorn + uvicorn worker',
          'nginx 反向代理',
        ],
        code: {
          lang: 'bash',
          body: `uvicorn main:app --host 0.0.0.0 --port 8000
gunicorn -k uvicorn.workers.UvicornWorker main:app -w 4`,
        },
        checklist: ['用 uvicorn 启动', '理解 ASGI 含义'],
        readMinutes: 13,
      },
    ],
    cases: [
      {
        slug: 'case-todo-api',
        title: '待办事项 REST API',
        tier: 'core',
        difficulty: 'medium',
        summary: 'FastAPI 实现增删改查',
        points: [
          '定义 Todo 模型',
          '实现列表与创建接口',
          'PATCH 更新完成状态',
          'DELETE 删除条目',
        ],
        code: {
          lang: 'python',
          body: `from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI()
todos = []

class Todo(BaseModel):
    title: str
    done: bool = False

@app.post("/todos")
def add(t: Todo):
    todos.append(t)
    return {"count": len(todos)}`,
        },
        checklist: ['能新增待办', '能列出待办'],
        readMinutes: 26,
      },
      {
        slug: 'case-blog',
        title: '简易博客系统',
        tier: 'key',
        difficulty: 'hard',
        summary: 'Django 实现文章与后台',
        points: [
          'Article 模型与迁移',
          '列表与详情视图',
          'admin 录入文章',
          '模板渲染页面',
        ],
        code: {
          lang: 'python',
          body: `from django.shortcuts import render
from .models import Article

def list_view(request):
    articles = Article.objects.all()[:10]
    return render(request, "list.html", {"articles": articles})`,
        },
        checklist: ['文章可后台录入', '前台能浏览'],
        readMinutes: 30,
      },
    ],
  },

  {
    id: 'py-data',
    name: '数据分析 (NumPy/Pandas/Matplotlib)',
    tier: 'key',
    difficulty: 'medium',
    chapters: [
      {
        slug: 'numpy',
        title: 'NumPy 数组',
        tier: 'basic',
        difficulty: 'easy',
        summary: '向量化计算的基石',
        points: [
          'ndarray 多维数组',
          '向量化运算免循环',
          'broadcasting 广播',
          '切片与 reshape',
        ],
        code: {
          lang: 'python',
          body: `import numpy as np

a = np.array([1, 2, 3])
b = a * 2
m = a.reshape(1, 3)
print(b, m.shape)`,
        },
        checklist: ['创建 ndarray', '做向量化运算'],
        readMinutes: 12,
      },
      {
        slug: 'pandas-intro',
        title: 'Pandas 数据结构',
        tier: 'core',
        difficulty: 'medium',
        summary: 'Series 与 DataFrame',
        points: [
          'Series 带索引的一维',
          'DataFrame 二维表格',
          'read_csv 读取数据',
          '列选择与方法链',
        ],
        code: {
          lang: 'python',
          body: `import pandas as pd

df = pd.read_csv("data.csv")
print(df.head())
print(df["price"].mean())`,
        },
        checklist: ['读取 CSV', '计算列均值'],
        readMinutes: 13,
      },
      {
        slug: 'pandas-clean',
        title: '数据清洗',
        tier: 'core',
        difficulty: 'medium',
        summary: '处理缺失与重复',
        points: [
          'dropna/ fillna 缺失值',
          'duplicated 去重',
          'astype 类型转换',
          'apply 自定义变换',
        ],
        code: {
          lang: 'python',
          body: `import pandas as pd

df = pd.DataFrame({"a": [1, None, 1], "b": [2, 3, 2]})
df = df.dropna().drop_duplicates()
df["a"] = df["a"].astype(int)
print(df)`,
        },
        checklist: ['处理缺失值', '去除重复行'],
        readMinutes: 14,
      },
      {
        slug: 'groupby',
        title: '分组聚合',
        tier: 'key',
        difficulty: 'medium',
        summary: 'groupby 统计',
        points: [
          'groupby 按列分组',
          'agg 多聚合函数',
          'pivot_table 透视',
          'value_counts 计数',
        ],
        code: {
          lang: 'python',
          body: `import pandas as pd

df = pd.DataFrame({"cat": ["a", "a", "b"], "v": [1, 2, 3]})
print(df.groupby("cat")["v"].agg(["sum", "mean"]))`,
        },
        checklist: ['按类别分组', '做聚合统计'],
        readMinutes: 13,
      },
      {
        slug: 'plot',
        title: 'Matplotlib 绘图',
        tier: 'core',
        difficulty: 'medium',
        summary: '折线图与柱状图',
        points: [
          'plot 折线图',
          'bar 柱状图',
          '标题/轴标签/图例',
          'subplots 多子图',
        ],
        code: {
          lang: 'python',
          body: `import matplotlib.pyplot as plt

x = [1, 2, 3]
y = [3, 1, 2]
plt.plot(x, y, marker="o")
plt.title("示例")
plt.xlabel("x")
plt.show()`,
        },
        checklist: ['画折线图', '加标题与轴标签'],
        readMinutes: 13,
      },
      {
        slug: 'seaborn',
        title: 'Seaborn 统计可视化',
        tier: 'extra',
        difficulty: 'medium',
        summary: '高级统计图',
        points: [
          'sns 美化默认样式',
          'heatmap 相关性',
          'boxplot 分布',
          'pairplot 成对关系',
        ],
        code: {
          lang: 'python',
          body: `import seaborn as sns
import matplotlib.pyplot as plt

tips = sns.load_dataset("tips")
sns.boxplot(data=tips, x="day", y="total_bill")
plt.show()`,
        },
        checklist: ['画箱线图', '理解相关性热力图'],
        readMinutes: 12,
      },
      {
        slug: 'io-formats',
        title: '数据读写格式',
        tier: 'extra',
        difficulty: 'easy',
        summary: 'CSV/JSON/Excel/Parquet',
        points: [
          'to_csv / to_json',
          'read_excel 读表格',
          'Parquet 列式高效',
          '压缩与性能权衡',
        ],
        code: {
          lang: 'python',
          body: `import pandas as pd

df = pd.DataFrame({"x": [1, 2]})
df.to_parquet("out.parquet")
df2 = pd.read_parquet("out.parquet")
print(df2)`,
        },
        checklist: ['读写 Parquet', '理解格式优劣'],
        readMinutes: 10,
      },
    ],
    cases: [
      {
        slug: 'case-sales',
        title: '销售数据分析',
        tier: 'core',
        difficulty: 'medium',
        summary: '从原始 CSV 到洞察',
        points: [
          '清洗缺失销售额',
          '按月汇总趋势',
          '绘制销售曲线',
          '输出结论报告',
        ],
        code: {
          lang: 'python',
          body: `import pandas as pd

df = pd.read_csv("sales.csv", parse_dates=["date"])
df = df.dropna()
monthly = df.groupby(df["date"].dt.to_period("M"))["amount"].sum()
print(monthly)`,
        },
        checklist: ['按月聚合', '可视化趋势'],
        readMinutes: 24,
      },
    ],
  },

  {
    id: 'py-crawler',
    name: '爬虫 (requests/bs4/selenium/反爬)',
    tier: 'core',
    difficulty: 'medium',
    chapters: [
      {
        slug: 'requests',
        title: 'requests 发起请求',
        tier: 'basic',
        difficulty: 'easy',
        summary: 'GET/POST 抓取网页',
        points: [
          'requests.get 获取响应',
          'status_code 判断成功',
          'params 传查询参数',
          'headers 设置 UA',
        ],
        code: {
          lang: 'python',
          body: `import requests

r = requests.get(
    "https://httpbin.org/get",
    params={"q": "python"},
    headers={"User-Agent": "Mozilla/5.0"},
    timeout=10,
)
print(r.status_code, r.json())`,
        },
        checklist: ['发起 GET 请求', '设置请求头'],
        readMinutes: 11,
      },
      {
        slug: 'bs4',
        title: 'BeautifulSoup 解析',
        tier: 'core',
        difficulty: 'easy',
        summary: '从 HTML 抽取数据',
        points: [
          'BeautifulSoup 解析文档',
          'find / find_all 定位',
          'select 用 CSS 选择器',
          'get_text 取文本',
        ],
        code: {
          lang: 'python',
          body: `from bs4 import BeautifulSoup

html = "<ul><li>甲</li><li>乙</li></ul>"
soup = BeautifulSoup(html, "html.parser")
items = [li.get_text() for li in soup.find_all("li")]
print(items)`,
        },
        checklist: ['用 find_all 提取', '使用 CSS 选择器'],
        readMinutes: 12,
      },
      {
        slug: 'xpath',
        title: 'XPath 与 lxml',
        tier: 'core',
        difficulty: 'medium',
        summary: '更强大的节点定位',
        points: [
          'lxml 高性能解析',
          'XPath 路径表达式',
          '谓语过滤节点',
          'text() 取文本',
        ],
        code: {
          lang: 'python',
          body: `from lxml import etree

tree = etree.HTML("<div><p class='x'>hi</p></div>")
texts = tree.xpath("//p[@class='x']/text()")
print(texts)`,
        },
        checklist: ['写 XPath 表达式', '按属性过滤'],
        readMinutes: 12,
      },
      {
        slug: 'selenium',
        title: 'Selenium 自动化',
        tier: 'key',
        difficulty: 'medium',
        summary: '抓取动态渲染页面',
        points: [
          'WebDriver 启动浏览器',
          'find_element 定位元素',
          '显式等待页面加载',
          '执行点击与输入',
        ],
        code: {
          lang: 'python',
          body: `from selenium import webdriver
from selenium.webdriver.common.by import By

driver = webdriver.Chrome()
driver.get("https://example.com")
title = driver.find_element(By.TAG_NAME, "h1").text
print(title)
driver.quit()`,
        },
        note: '动态站点优先尝试接口，Selenium 作为兜底。',
        checklist: ['启动浏览器', '等待并提取元素'],
        readMinutes: 15,
      },
      {
        slug: 'anti-crawl',
        title: '反爬与应对',
        tier: 'key',
        difficulty: 'hard',
        summary: 'UA、代理与验证码',
        points: [
          '随机 UA 与请求间隔',
          '代理 IP 池轮换',
          'Cookie 维持会话',
          '识别验证码与风控',
        ],
        code: {
          lang: 'python',
          body: `import random, requests

uas = ["Mozilla/5.0", "Chrome/120", "Safari/16"]
proxies = {"http": "http://10.0.0.1:8080"}
r = requests.get(
    "https://example.com",
    headers={"User-Agent": random.choice(uas)},
    proxies=proxies,
)
print(r.status_code)`,
        },
        checklist: ['配置随机 UA', '使用代理轮换'],
        readMinutes: 15,
      },
      {
        slug: 'async-crawl',
        title: '异步爬虫',
        tier: 'extra',
        difficulty: 'hard',
        summary: 'aiohttp 提升并发',
        points: [
          'aiohttp 异步请求',
          'asyncio.gather 并发',
          '限制并发信号量',
          '速率控制防封',
        ],
        code: {
          lang: 'python',
          body: `import asyncio, aiohttp

async def fetch(session, url):
    async with session.get(url) as r:
        return await r.text()

async def main():
    async with aiohttp.ClientSession() as s:
        pages = await asyncio.gather(
            fetch(s, "https://example.com"),
            fetch(s, "https://example.org"),
        )
        print(len(pages))

asyncio.run(main())`,
        },
        checklist: ['用 aiohttp 并发', '用信号量限流'],
        readMinutes: 16,
      },
      {
        slug: 'storage',
        title: '数据持久化',
        tier: 'extra',
        difficulty: 'easy',
        summary: '存库或文件',
        points: [
          '存为 CSV/JSON',
          '写入数据库',
          '增量去重',
          '断点续爬',
        ],
        code: {
          lang: 'json',
          body: `{
  "items": [
    {"title": "A", "url": "https://a"},
    {"title": "B", "url": "https://b"}
  ]
}`,
        },
        checklist: ['结果落盘', '支持断点续爬'],
        readMinutes: 10,
      },
    ],
    cases: [
      {
        slug: 'case-news',
        title: '新闻标题采集',
        tier: 'core',
        difficulty: 'medium',
        summary: '抓取并清洗新闻列表',
        points: [
          '请求新闻列表页',
          'BS4 提取标题链接',
          '去重入库',
          '定时增量更新',
        ],
        code: {
          lang: 'python',
          body: `import requests
from bs4 import BeautifulSoup

r = requests.get("https://news.example.com")
soup = BeautifulSoup(r.text, "html.parser")
news = [a.get_text(strip=True) for a in soup.select(".title a")]
print(news[:10])`,
        },
        checklist: ['提取标题', '去重保存'],
        readMinutes: 22,
      },
    ],
  },

  {
    id: 'py-auto',
    name: '自动化运维 (脚本/文件批处理/定时任务)',
    tier: 'core',
    difficulty: 'medium',
    chapters: [
      {
        slug: 'os-path',
        title: '路径与文件操作',
        tier: 'basic',
        difficulty: 'easy',
        summary: 'os/pathlib 管理文件',
        points: [
          'pathlib 面向对象路径',
          'glob 批量匹配文件',
          'mkdir/rmdir 目录',
          'exists/is_file 判断',
        ],
        code: {
          lang: 'python',
          body: `from pathlib import Path

for f in Path(".").glob("*.txt"):
    print(f.name, f.stat().st_size)`,
        },
        checklist: ['遍历匹配文件', '判断文件存在'],
        readMinutes: 10,
      },
      {
        slug: 'shutil',
        title: '批量文件处理',
        tier: 'core',
        difficulty: 'easy',
        summary: '复制移动与重命名',
        points: [
          'shutil.copy / move',
          '批量重命名',
          '压缩解压 zipfile',
          '目录树遍历',
        ],
        code: {
          lang: 'python',
          body: `import shutil
from pathlib import Path

for i, f in enumerate(Path("in").glob("*.jpg")):
    shutil.move(str(f), f"out/img_{i}.jpg")`,
        },
        checklist: ['批量重命名', '复制移动文件'],
        readMinutes: 11,
      },
      {
        slug: 'subprocess',
        title: '调用外部命令',
        tier: 'core',
        difficulty: 'medium',
        summary: 'subprocess 运行 shell',
        points: [
          'subprocess.run 执行命令',
          '捕获 stdout/stderr',
          'check=True 抛异常',
          '避免 shell 注入',
        ],
        code: {
          lang: 'python',
          body: `import subprocess

r = subprocess.run(
    ["ls", "-l"],
    capture_output=True,
    text=True,
    check=True,
)
print(r.stdout)`,
        },
        note: '尽量传列表参数而非 shell=True，防止注入。',
        checklist: ['运行命令并捕获输出', '用 check 处理错误'],
        readMinutes: 12,
      },
      {
        slug: 'logging',
        title: '日志与告警',
        tier: 'core',
        difficulty: 'medium',
        summary: '结构化记录运行',
        points: [
          'logging 分级记录',
          '配置 handler 与格式',
          '文件滚动 RotatingFileHandler',
          '异常捕获与告警',
        ],
        code: {
          lang: 'python',
          body: `import logging

logging.basicConfig(
    filename="app.log",
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(message)s",
)
logging.info("任务开始")
logging.error("出错了")`,
        },
        checklist: ['配置日志文件', '分级记录'],
        readMinutes: 12,
      },
      {
        slug: 'schedule',
        title: '定时任务',
        tier: 'key',
        difficulty: 'medium',
        summary: '调度脚本周期运行',
        points: [
          'schedule 库简单定时',
          'APScheduler 高级调度',
          'crontab 系统级',
          '守护进程常驻',
        ],
        code: {
          lang: 'python',
          body: `import schedule, time

def job():
    print("每日备份")

schedule.every().day.at("02:00").do(job)
while True:
    schedule.run_pending()
    time.sleep(60)`,
        },
        checklist: ['设置每日任务', '循环触发调度'],
        readMinutes: 13,
      },
      {
        slug: 'config',
        title: '配置与环境变量',
        tier: 'extra',
        difficulty: 'easy',
        summary: 'yaml/env 管理配置',
        points: [
          'python-dotenv 读取 .env',
          'yaml.safe_load 解析',
          '区分开发生产配置',
          '敏感信息不入仓库',
        ],
        code: {
          lang: 'yaml',
          body: `database:
  host: localhost
  port: 5432
debug: true`,
        },
        checklist: ['读取 .env', '解析 yaml 配置'],
        readMinutes: 10,
      },
      {
        slug: 'deploy-script',
        title: '部署与监控脚本',
        tier: 'extra',
        difficulty: 'hard',
        summary: '健康检查与自愈',
        points: [
          '探测服务端口健康',
          '异常自动重启',
          '钉钉/邮件告警',
          '资源占用监控',
        ],
        code: {
          lang: 'python',
          body: `import socket, subprocess

def healthy(host, port):
    s = socket.socket()
    try:
        s.connect((host, port))
        return True
    except OSError:
        return False
    finally:
        s.close()

if not healthy("127.0.0.1", 8000):
    subprocess.run(["systemctl", "restart", "app"])`,
        },
        checklist: ['端口健康检查', '异常自动重启'],
        readMinutes: 14,
      },
    ],
    cases: [
      {
        slug: 'case-backup',
        title: '日志自动备份',
        tier: 'core',
        difficulty: 'medium',
        summary: '定时压缩并归档日志',
        points: [
          '遍历日志目录',
          'zipfile 压缩归档',
          '按日期命名',
          '清理过期文件',
        ],
        code: {
          lang: 'python',
          body: `import zipfile
from pathlib import Path
from datetime import date

with zipfile.ZipFile(f"logs_{date.today()}.zip", "w") as z:
    for f in Path("logs").glob("*.log"):
        z.write(f)`,
        },
        checklist: ['压缩日志', '按日归档'],
        readMinutes: 20,
      },
    ],
  },

  {
    id: 'py-ml',
    name: 'ML/DL 基础 (scikit-learn/TensorFlow/PyTorch)',
    tier: 'key',
    difficulty: 'hard',
    chapters: [
      {
        slug: 'ml-concepts',
        title: '机器学习概念',
        tier: 'basic',
        difficulty: 'medium',
        summary: '监督/无监督与流程',
        points: [
          '训练集/验证集/测试集',
          '特征与标签',
          '回归与分类',
          '过拟合与泛化',
        ],
        code: {
          lang: 'plaintext',
          body: `流程:
1. 收集数据
2. 清洗与特征工程
3. 选择模型
4. 训练并评估
5. 调参与部署`,
        },
        checklist: ['说清三种数据集', '理解过拟合'],
        readMinutes: 12,
      },
      {
        slug: 'sklearn',
        title: 'scikit-learn 管线',
        tier: 'core',
        difficulty: 'medium',
        summary: '经典模型快速上手',
        points: [
          'train_test_split 切分',
          'fit/predict 接口',
          'Pipeline 串联预处理',
          '评估指标 accuracy/f1',
        ],
        code: {
          lang: 'python',
          body: `from sklearn.model_selection import train_test_split
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2)
model = LogisticRegression().fit(X_train, y_train)
print(accuracy_score(y_test, model.predict(X_test)))`,
        },
        checklist: ['训练分类模型', '计算准确率'],
        readMinutes: 14,
      },
      {
        slug: 'features',
        title: '特征工程',
        tier: 'key',
        difficulty: 'medium',
        summary: '编码与标准化',
        points: [
          'OneHotEncoder 类别编码',
          'StandardScaler 标准化',
          '缺失值填充',
          '特征选择降维',
        ],
        code: {
          lang: 'python',
          body: `from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import make_pipeline
from sklearn.linear_model import Ridge

pipe = make_pipeline(StandardScaler(), Ridge())
pipe.fit(X_train, y_train)`,
        },
        checklist: ['标准化特征', '用 Pipeline 串联'],
        readMinutes: 13,
      },
      {
        slug: 'tf',
        title: 'TensorFlow 入门',
        tier: 'key',
        difficulty: 'hard',
        summary: 'Keras 顺序模型',
        points: [
          'Sequential 堆叠层',
          'compile 指定损失优化器',
          'fit 训练',
          'evaluate 评估',
        ],
        code: {
          lang: 'python',
          body: `import tensorflow as tf

model = tf.keras.Sequential([
    tf.keras.layers.Dense(64, activation="relu", input_shape=(10,)),
    tf.keras.layers.Dense(1, activation="sigmoid"),
])
model.compile(optimizer="adam", loss="binary_crossentropy")
model.fit(X, y, epochs=5, batch_size=32)`,
        },
        checklist: ['搭建顺序模型', '完成训练'],
        readMinutes: 16,
      },
      {
        slug: 'pytorch',
        title: 'PyTorch 张量与反向传播',
        tier: 'key',
        difficulty: 'hard',
        summary: '动态图训练循环',
        points: [
          'torch.Tensor 计算图',
          'nn.Module 定义网络',
          'loss.backward 求梯度',
          'optimizer.step 更新',
        ],
        code: {
          lang: 'python',
          body: `import torch, torch.nn as nn

model = nn.Linear(10, 1)
opt = torch.optim.SGD(model.parameters(), lr=0.01)
x, y = torch.randn(32, 10), torch.randn(32, 1)
loss = nn.MSELoss()(model(x), y)
opt.zero_grad()
loss.backward()
opt.step()`,
        },
        checklist: ['定义网络', '手动训练一步'],
        readMinutes: 17,
      },
      {
        slug: 'evaluation',
        title: '模型评估',
        tier: 'core',
        difficulty: 'hard',
        summary: '指标与交叉验证',
        points: [
          '混淆矩阵与 ROC',
          'cross_val_score 交叉验证',
          'precision/recall 权衡',
          '学习曲线诊断',
        ],
        code: {
          lang: 'python',
          body: `from sklearn.model_selection import cross_val_score
from sklearn.ensemble import RandomForestClassifier

scores = cross_val_score(RandomForestClassifier(), X, y, cv=5)
print(scores.mean())`,
        },
        checklist: ['做交叉验证', '解读评估指标'],
        readMinutes: 14,
      },
      {
        slug: 'deploy-ml',
        title: '模型保存与部署',
        tier: 'extra',
        difficulty: 'hard',
        summary: '导出与服务化',
        points: [
          'joblib 保存 sklearn',
          'SavedModel / .pt 导出',
          'FastAPI 加载推理',
          '批处理与流式',
        ],
        code: {
          lang: 'python',
          body: `import joblib

joblib.dump(model, "model.pkl")
loaded = joblib.load("model.pkl")
print(loaded.predict(X[:1]))`,
        },
        checklist: ['保存模型', '加载并推理'],
        readMinutes: 13,
      },
    ],
    cases: [
      {
        slug: 'case-clf',
        title: '鸢尾花分类',
        tier: 'core',
        difficulty: 'medium',
        summary: '端到端训练分类器',
        points: [
          '加载 iris 数据集',
          '划分训练测试集',
          '训练随机森林',
          '输出评估指标',
        ],
        code: {
          lang: 'python',
          body: `from sklearn.datasets import load_iris
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split

X, y = load_iris(return_X_y=True)
Xtr, Xte, ytr, yte = train_test_split(X, y, test_size=0.2)
clf = RandomForestClassifier().fit(Xtr, ytr)
print(clf.score(Xte, yte))`,
        },
        checklist: ['训练并评估', '准确率合理'],
        readMinutes: 24,
      },
      {
        slug: 'case-mnist',
        title: '手写数字识别',
        tier: 'key',
        difficulty: 'hard',
        summary: 'PyTorch 训练 CNN',
        points: [
          '加载 MNIST 数据',
          '定义卷积网络',
          '训练若干轮',
          '测试准确率',
        ],
        code: {
          lang: 'python',
          body: `import torch.nn as nn

class Net(nn.Module):
    def __init__(self):
        super().__init__()
        self.conv = nn.Sequential(
            nn.Conv2d(1, 8, 3), nn.ReLU(), nn.Flatten()
        )
        self.fc = nn.Linear(8 * 26 * 26, 10)

    def forward(self, x):
        return self.fc(self.conv(x))`,
        },
        checklist: ['定义 CNN', '完成 MNIST 训练'],
        readMinutes: 30,
      },
    ],
  },

  {
    id: 'py-async',
    name: '异步与并发 (asyncio/多线程/多进程)',
    tier: 'key',
    difficulty: 'hard',
    chapters: [
      {
        slug: 'threads',
        title: '多线程基础',
        tier: 'basic',
        difficulty: 'medium',
        summary: 'threading 并行 I/O',
        points: [
          'Thread 创建线程',
          'join 等待结束',
          'GIL 限制 CPU 并行',
          '适合 I/O 密集',
        ],
        code: {
          lang: 'python',
          body: `import threading

def task(n):
    print(f"task {n}")

ts = [threading.Thread(target=task, args=(i,)) for i in range(3)]
for t in ts:
    t.start()
for t in ts:
    t.join()`,
        },
        checklist: ['创建并启动线程', '用 join 等待'],
        readMinutes: 12,
      },
      {
        slug: 'lock',
        title: '锁与同步',
        tier: 'core',
        difficulty: 'medium',
        summary: '避免竞态条件',
        points: [
          'Lock 互斥访问',
          '共享变量加锁',
          '死锁成因与规避',
          'Queue 线程安全通信',
        ],
        code: {
          lang: 'python',
          body: `import threading

lock = threading.Lock()
counter = 0

def inc():
    global counter
    with lock:
        counter += 1

ts = [threading.Thread(target=inc) for _ in range(10)]
for t in ts:
    t.start()
for t in ts:
    t.join()
print(counter)`,
        },
        checklist: ['用 Lock 保护计数', '避免竞态'],
        readMinutes: 13,
      },
      {
        slug: 'process',
        title: '多进程',
        tier: 'core',
        difficulty: 'medium',
        summary: '绕过 GIL 做 CPU 并行',
        points: [
          'Process 独立进程',
          'multiprocessing.Pool',
          '进程间通信 Queue',
          '适合 CPU 密集',
        ],
        code: {
          lang: 'python',
          body: `from multiprocessing import Pool

def square(x):
    return x * x

with Pool(4) as p:
    print(p.map(square, range(10)))`,
        },
        checklist: ['用进程池并行', '理解 GIL 突破'],
        readMinutes: 13,
      },
      {
        slug: 'asyncio-basics',
        title: 'asyncio 协程',
        tier: 'key',
        difficulty: 'hard',
        summary: 'async/await 单线程并发',
        points: [
          'async def 定义协程',
          'await 挂起等待',
          'asyncio.run 驱动',
          '事件循环机制',
        ],
        code: {
          lang: 'python',
          body: `import asyncio

async def hello():
    await asyncio.sleep(1)
    return "done"

print(asyncio.run(hello()))`,
        },
        checklist: ['定义协程', '用 asyncio.run 运行'],
        readMinutes: 14,
      },
      {
        slug: 'async-gather',
        title: '并发任务编排',
        tier: 'key',
        difficulty: 'hard',
        summary: 'gather/create_task',
        points: [
          'asyncio.gather 并发',
          'create_task 调度',
          'Task 取消与超时',
          '对比同步顺序执行',
        ],
        code: {
          lang: 'python',
          body: `import asyncio

async def fetch(i):
    await asyncio.sleep(0.1)
    return i

async def main():
    res = await asyncio.gather(*(fetch(i) for i in range(5)))
    print(res)

asyncio.run(main())`,
        },
        checklist: ['并发运行任务', '收集结果'],
        readMinutes: 15,
      },
      {
        slug: 'async-io',
        title: '异步 I/O 实战',
        tier: 'key',
        difficulty: 'hard',
        summary: 'aiohttp/aiomysql',
        points: [
          '异步客户端提吞吐',
          '连接池复用',
          '避免阻塞事件循环',
          'run_in_executor 跑同步',
        ],
        code: {
          lang: 'python',
          body: `import asyncio, aiohttp

async def get(url):
    async with aiohttp.ClientSession() as s:
        async with s.get(url) as r:
            return r.status

print(asyncio.run(get("https://example.com")))`,
        },
        checklist: ['异步请求', '理解非阻塞'],
        readMinutes: 15,
      },
      {
        slug: 'concurrency-choice',
        title: '并发模型选型',
        tier: 'extra',
        difficulty: 'hard',
        summary: '何时用哪种',
        points: [
          'I/O 密集选异步/线程',
          'CPU 密集选多进程',
          '混合场景组合使用',
          '性能与复杂度权衡',
        ],
        code: {
          lang: 'plaintext',
          body: `选型:
CPU 密集 -> multiprocessing
I/O 密集 -> asyncio / threading
高并发网络 -> asyncio
简单并行 -> ThreadPoolExecutor`,
        },
        checklist: ['能按场景选型', '理解模型差异'],
        readMinutes: 12,
      },
    ],
    cases: [
      {
        slug: 'case-concurrent-fetch',
        title: '并发网页抓取',
        tier: 'core',
        difficulty: 'hard',
        summary: 'asyncio 抓取多页',
        points: [
          '并发请求多个 URL',
          '限制并发信号量',
          '收集状态码',
          '异常处理失败任务',
        ],
        code: {
          lang: 'python',
          body: `import asyncio, aiohttp

async def fetch(s, url):
    async with s.get(url) as r:
        return r.status

async def main(urls):
    async with aiohttp.ClientSession() as s:
        return await asyncio.gather(*(fetch(s, u) for u in urls))

print(asyncio.run(main(["https://example.com"] * 3)))`,
        },
        checklist: ['并发抓取', '限制并发数'],
        readMinutes: 26,
      },
      {
        slug: 'case-cpu-pool',
        title: 'CPU 密集并行计算',
        tier: 'key',
        difficulty: 'hard',
        summary: '多进程加速计算',
        points: [
          '拆分计算任务',
          '进程池并行执行',
          '汇总结果',
          '对比单进程耗时',
        ],
        code: {
          lang: 'python',
          body: `from multiprocessing import Pool
import math

def heavy(n):
    return sum(math.sqrt(i) for i in range(n))

if __name__ == "__main__":
    with Pool() as p:
        print(p.map(heavy, [100000] * 4))`,
        },
        note: '多进程代码放在 if __name__ == "__main__" 下避免递归派生。',
        checklist: ['进程池并行', '正确汇总结果'],
        readMinutes: 28,
      },
    ],
  },
];
