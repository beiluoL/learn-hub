// Python 学习文章内容
export const pythonArticles = [
  {
    id: 'py-basics',
    title: 'Python 基础语法与数据结构',
    level: 'beginner',
    readMinutes: 12,
    tags: ['基础', '数据类型', '语法'],
    summary: '掌握变量、缩进、内置数据结构与推导式，建立 Python 直觉。',
    content: `
<h2>一、变量与动态类型</h2>
<p>Python 是动态强类型语言，变量无需声明类型，但类型本身是严格的：</p>
<pre><code>name = "Tom"        # str
age = 18            # int
scores = [90, 85]   # list
age = "18"          # 允许重新绑定为 str（弱约定，不推荐）</code></pre>
<p>注意：<code>is</code> 比较身份（内存地址），<code>==</code> 比较值。小整数（-5~256）和短字符串有驻留（interning）缓存。</p>

<h2>二、核心数据结构</h2>
<table>
  <tr><th>类型</th><th>特点</th><th>示例</th></tr>
  <tr><td>list</td><td>有序可变，可重复</td><td><code>[1, 2, 2]</code></td></tr>
  <tr><td>tuple</td><td>有序不可变</td><td><code>(1, 2)</code></td></tr>
  <tr><td>set</td><td>无序去重</td><td><code>{1, 2}</code></td></tr>
  <tr><td>dict</td><td>键值映射（3.7+ 保序）</td><td><code>{"a": 1}</code></td></tr>
</table>

<h2>三、推导式（Comprehension）</h2>
<p>用一行生成容器，可读且高效：</p>
<pre><code>squares = [x*x for x in range(10) if x % 2 == 0]
mapped = {k: v*2 for k, v in {"a": 1}.items()}
evens = {x for x in range(10) if x % 2 == 0}</code></pre>

<h2>四、控制流与函数</h2>
<pre><code>def greet(name, *, loud=False):   # * 后为仅关键字参数
    msg = f"Hello, {name}"
    return msg.upper() if loud else msg

for i in range(3):
    print(i)
[x for x in range(3)]</code></pre>
`,
  },
  {
    id: 'py-decorator',
    title: '函数、闭包与装饰器',
    level: 'intermediate',
    readMinutes: 15,
    tags: ['装饰器', '闭包', '高阶函数'],
    summary: '理解一等函数、闭包原理，手写可用的装饰器与带参装饰器。',
    content: `
<h2>一、一等函数与高阶函数</h2>
<p>函数是对象，可作为参数、返回值、存入容器：</p>
<pre><code>def apply(f, x):
    return f(x)
apply(lambda n: n+1, 10)   # 11</code></pre>

<h2>二、闭包（Closure）</h2>
<p>内层函数引用外层变量，且外层已返回，变量被"封存"：</p>
<pre><code>def make_counter():
    count = 0
    def counter():
        nonlocal count      # 声明修改外层变量
        count += 1
        return count
    return counter

c = make_counter()
c(); c()   # 1, 2</code></pre>

<h2>三、装饰器（Decorator）</h2>
<p>装饰器是"接收函数、返回函数"的高阶函数，用于横切逻辑（日志、计时、鉴权）：</p>
<pre><code>import time
def timer(func):
    def wrapper(*args, **kwargs):
        t = time.time()
        res = func(*args, **kwargs)
        print(f"{func.__name__} 耗时 {time.time()-t:.3f}s")
        return res
    return wrapper

@timer
def slow():
    time.sleep(0.5)</code></pre>
<p>带参装饰器需要再包一层；用 <code>functools.wraps</code> 保留原函数的元信息（name/doc）。</p>
`,
  },
  {
    id: 'py-asyncio',
    title: '异步编程：asyncio 与协程',
    level: 'advanced',
    readMinutes: 17,
    tags: ['asyncio', '协程', '并发', 'async/await'],
    summary: '用 async/await 处理高并发 IO，理解事件循环与协程调度。',
    content: `
<h2>一、协程基础</h2>
<p><code>async def</code> 定义协程，<code>await</code> 挂起等待可等待对象（协程/Task/Future）：</p>
<pre><code>import asyncio

async def fetch(name):
    print(f"{name} start")
    await asyncio.sleep(1)     # 模拟 IO，不阻塞事件循环
    print(f"{name} done")

async def main():
    await asyncio.gather(fetch("A"), fetch("B"))

asyncio.run(main())</code></pre>

<h2>二、并发执行</h2>
<ul>
  <li><code>asyncio.gather(*tasks)</code>：并发等待多个，返回结果列表</li>
  <li><code>asyncio.create_task(coro)</code>：把协程包装为 Task 立即调度</li>
  <li><code>asyncio.to_thread(fn)</code>：把阻塞函数丢到线程池，避免阻塞循环</li>
</ul>

<h2>三、注意事项</h2>
<ul>
  <li>协程擅长 <b>IO 密集型</b>（网络、文件）；CPU 密集请用多进程（<code>ProcessPoolExecutor</code>）</li>
  <li>不要在协程里写同步阻塞调用（如 <code>time.sleep</code>），会卡住整个循环</li>
  <li>共享状态用 <code>asyncio.Lock</code>，别用 threading.Lock</li>
</ul>
<pre><code>async with asyncio.Lock():
    # 临界区</code></pre>
`,
  },
  {
    id: 'py-web',
    title: 'Web 开发：FastAPI 实战',
    level: 'intermediate',
    readMinutes: 16,
    tags: ['FastAPI', 'Web', 'API', 'Pydantic'],
    summary: '用 FastAPI 快速构建类型安全、自带文档的异步 Web 服务。',
    content: `
<h2>一、最小应用</h2>
<pre><code>from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI()

class Item(BaseModel):
    name: str
    price: float

@app.get("/")
def root():
    return {"msg": "hello"}

@app.post("/items")
def create(item: Item):
    return {"id": 1, **item.model_dump()}</code></pre>
<p>启动：<code>uvicorn main:app --reload</code>，自动获得 <code>/docs</code> 交互式 Swagger 文档。</p>

<h2>二、为什么快</h2>
<ul>
  <li>基于 <b>Starlette</b>（ASGI）+ <b>Pydantic</b>（数据校验），原生支持异步</li>
  <li>依赖注入系统管理数据库连接、鉴权等</li>
  <li>类型标注驱动自动校验与文档生成</li>
</ul>

<h2>三、依赖注入示例</h2>
<pre><code>from fastapi import Depends

def get_db():
    db = connect()
    try:
        yield db
    finally:
        db.close()

@app.get("/users")
def list_users(db = Depends(get_db)):
    return db.query("SELECT * FROM users")</code></pre>
<p>对比 Flask（同步、轻量、生态成熟）与 Django（全家桶、ORM 强）：选 FastAPI 做现代 API 服务，选 Django 做传统全栈业务。</p>
`,
  },
  {
    id: 'py-data',
    title: '数据处理：NumPy 与 Pandas',
    level: 'intermediate',
    readMinutes: 15,
    tags: ['NumPy', 'Pandas', '数据分析', '科学计算'],
    summary: '用向量化思想处理表格与数组数据，远离慢速 for 循环。',
    content: `
<h2>一、NumPy：向量化计算</h2>
<p>ndarray 是同构多维数组，底层 C 实现，向量化远快于 Python 循环：</p>
<pre><code>import numpy as np
a = np.array([1, 2, 3])
b = a * 2            # 向量化，无需循环
c = np.where(a &gt; 1, a, 0)</code></pre>

<h2>二、Pandas：表格分析</h2>
<pre><code>import pandas as pd
df = pd.read_csv("data.csv")
df.head()
df[df["score"] &gt; 90]["name"]
grouped = df.groupby("class")["score"].mean()
df["pass"] = df["score"] &gt;= 60</code></pre>
<ul>
  <li><code>Series</code>：带标签的一维数组；<code>DataFrame</code>：二维表格</li>
  <li>常用：筛选、groupby、merge/join、pivot_table、apply</li>
  <li>避免对大 DataFrame 用 <code>apply</code> 逐行 Python 循环，优先向量化或 <code>eval</code></li>
</ul>
<h2>三、典型数据管道</h2>
<p>读取 → 清洗（去重/填充缺失）→ 特征工程 → 分析/建模 → 可视化（matplotlib / seaborn）。</p>
`,
  },
];
