---
title: 多进程
category: python
module: py-async
subcat: roadmap
timeline: false
level: medium
tier: core
readMinutes: 13
tags: 异步与并发 (asyncio/多线程/多进程)
summary: 绕过 GIL 做 CPU 并行
order: 3
---

- Process 独立进程
- multiprocessing.Pool
- 进程间通信 Queue
- 适合 CPU 密集

```python
from multiprocessing import Pool

def square(x):
    return x * x

with Pool(4) as p:
    print(p.map(square, range(10)))
```

**自查清单**
- [ ] 用进程池并行
- [ ] 理解 GIL 突破
