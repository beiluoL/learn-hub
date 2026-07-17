---
title: asyncio 协程
category: python
module: py-async
subcat: roadmap
timeline: false
level: hard
tier: key
readMinutes: 14
tags: 异步与并发 (asyncio/多线程/多进程)
summary: async/await 单线程并发
order: 4
---

- async def 定义协程
- await 挂起等待
- asyncio.run 驱动
- 事件循环机制

```python
import asyncio

async def hello():
    await asyncio.sleep(1)
    return "done"

print(asyncio.run(hello()))
```

**自查清单**
- [ ] 定义协程
- [ ] 用 asyncio.run 运行
