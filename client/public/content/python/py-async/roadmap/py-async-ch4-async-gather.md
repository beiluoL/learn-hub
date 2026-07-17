---
title: 并发任务编排
category: python
module: py-async
subcat: roadmap
timeline: false
level: hard
tier: key
readMinutes: 15
tags: 异步与并发 (asyncio/多线程/多进程)
summary: gather/create_task
order: 5
---

- asyncio.gather 并发
- create_task 调度
- Task 取消与超时
- 对比同步顺序执行

```python
import asyncio

async def fetch(i):
    await asyncio.sleep(0.1)
    return i

async def main():
    res = await asyncio.gather(*(fetch(i) for i in range(5)))
    print(res)

asyncio.run(main())
```

**自查清单**
- [ ] 并发运行任务
- [ ] 收集结果
