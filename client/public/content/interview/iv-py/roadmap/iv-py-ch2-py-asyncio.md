---
title: 异步 asyncio
category: interview
module: iv-py
subcat: roadmap
timeline: false
level: hard
tier: key
readMinutes: 12
tags: "Python 面试, Python, 异步"
summary: 协程、事件循环与 async/await
order: 3
---

- async def 定义协程，await 挂起点
- 事件循环调度协程，单线程并发
- asyncio.gather 并发运行多个任务

```python
import asyncio

async def main():
    await asyncio.sleep(1)
    return 'done'

print(asyncio.run(main()))
```

> 协程遇到阻塞 IO 才会让出，CPU 密集仍需多进程。

**自查清单**
- [ ] 能说协程原理
- [ ] 能用 gather
