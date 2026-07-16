---
title: Python 并发模型详解：GIL 限制与线程/进程/协程选型
category: python
level: advanced
readMinutes: 22
tags: "GIL, 线程, 多进程, 协程, asyncio"
summary: Python 并发模型详解：GIL 限制与线程/进程/协程选型。
order: 28
prereq: python/py-basics
---

Python 的并发编程比其他语言更复杂，根本原因在于全局解释器锁（GIL）。理解 GIL 的工作机制、适用场景和绕过方法，是编写高性能 Python 程序的必修课。

## GIL 是什么

GIL（Global Interpreter Lock）是 CPython 解释器中的一个互斥锁，确保同一时刻只有一个线程执行 Python 字节码。它是 CPython 内存管理（引用计数）线程安全的保障，但也限制了多线程在 CPU 密集型任务上的并行能力。

GIL 在以下时机释放：
1. 线程进行 IO 操作时（文件读写、网络请求、sleep）
2. 每执行约 100 条字节码指令后（Python 3.2+ 的固定间隔机制）
3. 显式调用 C 扩展并释放 GIL 时

GIL 的释放是"协作式"而非"抢占式"的——线程必须主动释放 GIL，而非被其他线程抢占。

## threading 线程（IO 密集型）

Python 的 `threading` 模块适合 IO 密集型任务，因为在等待 IO 时 GIL 会释放：

```python
import threading
import time
import requests

def fetch_url(url):
    print(f'开始下载: {url}')
    response = requests.get(url)
    print(f'{url} 下载完成, 长度: {len(response.text)}')

urls = ['https://httpbin.org/delay/1'] * 5

# 多线程版本
start = time.time()
threads = []
for url in urls:
    t = threading.Thread(target=fetch_url, args=(url,))
    threads.append(t)
    t.start()

for t in threads:
    t.join()
print(f'多线程耗时: {time.time() - start:.2f}s')
# 输出约 1-2 秒（而非串行的 5+ 秒）
```

## multiprocessing 多进程（CPU 密集型）

对于 CPU 密集型任务，应使用 `multiprocessing` 绕过 GIL：

```python
import multiprocessing
import time

def compute_sum(n):
    """CPU 密集型：计算平方和"""
    return sum(i * i for i in range(n))

numbers = [10_000_000] * 4

# 多进程版本（真正并行）
start = time.time()
with multiprocessing.Pool(processes=4) as pool:
    results = pool.map(compute_sum, numbers)
print(f'多进程耗时: {time.time() - start:.2f}s')

# 对比：多线程版本（GIL 下无法并行）
start = time.time()
threads = []
results = []
def worker(n):
    results.append(compute_sum(n))
for n in numbers:
    t = threading.Thread(target=worker, args=(n,))
    threads.append(t)
    t.start()
for t in threads:
    t.join()
print(f'多线程耗时: {time.time() - start:.2f}s')
# 多进程版本通常比多线程版本快 3-4 倍
```

## concurrent.futures：线程池与进程池

`concurrent.futures` 提供了更高级的线程池和进程池接口：

```python
from concurrent.futures import ThreadPoolExecutor, ProcessPoolExecutor, as_completed

def download_and_process(url):
    data = requests.get(url).json()
    return process_data(data)

urls = ['https://api.example.com/items/{}'.format(i) for i in range(20)]

# 线程池（IO 密集型）
with ThreadPoolExecutor(max_workers=10) as executor:
    future_to_url = {executor.submit(download_and_process, url): url for url in urls}
    for future in as_completed(future_to_url):
        url = future_to_url[future]
        try:
            result = future.result()
            print(f'{url}: 成功')
        except Exception as e:
            print(f'{url}: 失败 - {e}')

# 进程池（CPU 密集型）
with ProcessPoolExecutor(max_workers=4) as executor:
    results = list(executor.map(heavy_computation, data_chunks))
```

## asyncio 事件循环与协程

asyncio 是 Python 的异步 IO 框架，使用单线程事件循环实现高并发：

```python
import asyncio
import aiohttp

async def fetch(session, url):
    async with session.get(url) as response:
        return await response.json()

async def main():
    urls = ['https://httpbin.org/delay/1'] * 10
    async with aiohttp.ClientSession() as session:
        tasks = [fetch(session, url) for url in urls]
        results = await asyncio.gather(*tasks)  # 并发执行
    return results

asyncio.run(main())
```

`async/await` 语法让协程代码看起来像同步代码，但底层是事件循环驱动的非阻塞 IO。

## 协程 vs 线程 vs 进程选型表

| 场景 | 推荐方案 | 原因 |
|------|---------|------|
| IO 密集型（网络请求、数据库查询） | asyncio > threading | 异步开销最小，协程切换成本远低于线程 |
| CPU 密集型（数值计算、图像处理） | multiprocessing | 绕过 GIL，利用多核 |
| 混合 IO/CPU | ProcessPoolExecutor + 异步调度 | 进程做计算，异步做 IO |
| 少量异步并发（< 100） | threading | 代码简单，无需改造全链路 |
| 大量异步并发（> 1000） | asyncio | 单线程无上下文切换开销 |
| 需要进程隔离（稳定性要求高） | multiprocessing | 进程间内存隔离，崩溃不影响其他 |

## 代码示例：三种方式处理相同任务

```python
# 任务：并发请求 20 个 URL，获取数据并计算统计信息

# 1. threading 版本
def task_threading(urls):
    results = []
    lock = threading.Lock()
    def worker(url):
        data = requests.get(url, timeout=10).json()
        stat = sum(data['values'])
        with lock:
            results.append(stat)
    threads = [threading.Thread(target=worker, args=(u,)) for u in urls]
    for t in threads:
        t.start()
    for t in threads:
        t.join()
    return results

# 2. multiprocessing 版本（计算统计信息较重时适用）
def compute_stat(url):
    data = requests.get(url, timeout=10).json()
    return sum(data['values'])

def task_multiprocessing(urls):
    with ProcessPoolExecutor(max_workers=4) as executor:
        return list(executor.map(compute_stat, urls))

# 3. asyncio 版本（最高效）
async def task_asyncio(urls):
    async with aiohttp.ClientSession() as session:
        async def worker(url):
            async with session.get(url) as resp:
                data = await resp.json()
                return sum(data['values'])
        return await asyncio.gather(*[worker(u) for u in urls])

results = asyncio.run(task_asyncio(urls))
```

## 实际开发中的应用 / 常见问题

**如何判断任务是 IO 密集还是 CPU 密集**：用 `top`/`htop` 观察进程的 CPU 使用率和等待时间。CPU 使用率高（>80%）且 IO 等待少，属于 CPU 密集；CPU 使用率低但响应慢，属于 IO 密集。

**asyncio 的阻塞陷阱**：在 `async` 函数中使用同步阻塞调用（如 `requests.get`）会阻塞整个事件循环。解决方案是使用对应的异步库（`aiohttp`）或使用 `loop.run_in_executor(None, blocking_func)` 在线程池中执行。

**多进程的序列化开销**：`multiprocessing` 通过 pickle 序列化在进程间传递数据，大量数据传输时序列化开销可能比计算本身还高。对于大数据集，考虑使用 `multiprocessing.shared_memory`（Python 3.8+）或 mmap 共享内存。
