---
title: 并发模型选型
category: python
module: py-async
subcat: roadmap
timeline: false
level: hard
tier: extra
readMinutes: 12
tags: 异步与并发 (asyncio/多线程/多进程)
summary: 何时用哪种
order: 7
---

- I/O 密集选异步/线程
- CPU 密集选多进程
- 混合场景组合使用
- 性能与复杂度权衡

```plaintext
选型:
CPU 密集 -> multiprocessing
I/O 密集 -> asyncio / threading
高并发网络 -> asyncio
简单并行 -> ThreadPoolExecutor
```

**自查清单**
- [ ] 能按场景选型
- [ ] 理解模型差异
