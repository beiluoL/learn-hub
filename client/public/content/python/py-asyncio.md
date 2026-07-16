---
title: 异步编程：asyncio 与协程
category: python
level: advanced
readMinutes: 17
tags: "asyncio, 协程, 并发, async/await"
summary: 用 async/await 处理高并发 IO，理解事件循环与协程调度。
order: 3
---

## 一、协程基础

`async def` 定义协程，`await` 挂起等待可等待对象（协程/Task/Future）：

```
import asyncio

async def fetch(name):
    print(f"{name} start")
    await asyncio.sleep(1)     # 模拟 IO，不阻塞事件循环
    print(f"{name} done")

async def main():
    await asyncio.gather(fetch("A"), fetch("B"))

asyncio.run(main())
```

## 二、并发执行

-   `asyncio.gather(*tasks)`：并发等待多个，返回结果列表
-   `asyncio.create_task(coro)`：把协程包装为 Task 立即调度
-   `asyncio.to_thread(fn)`：把阻塞函数丢到线程池，避免阻塞循环

## 三、注意事项

-   协程擅长 **IO 密集型**（网络、文件）；CPU 密集请用多进程（`ProcessPoolExecutor`）
-   不要在协程里写同步阻塞调用（如 `time.sleep`），会卡住整个循环
-   共享状态用 `asyncio.Lock`，别用 threading.Lock

```
async with asyncio.Lock():
    # 临界区
```
