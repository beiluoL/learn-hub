---
title: 多线程基础
category: python
module: py-async
subcat: roadmap
timeline: false
level: medium
tier: basic
readMinutes: 12
tags: 异步与并发 (asyncio/多线程/多进程)
summary: threading 并行 I/O
order: 1
---

- Thread 创建线程
- join 等待结束
- GIL 限制 CPU 并行
- 适合 I/O 密集

```python
import threading

def task(n):
    print(f"task {n}")

ts = [threading.Thread(target=task, args=(i,)) for i in range(3)]
for t in ts:
    t.start()
for t in ts:
    t.join()
```

**自查清单**
- [ ] 创建并启动线程
- [ ] 用 join 等待
