---
title: 锁与同步
category: python
module: py-async
subcat: roadmap
timeline: false
level: medium
tier: core
readMinutes: 13
tags: 异步与并发 (asyncio/多线程/多进程)
summary: 避免竞态条件
order: 2
---

- Lock 互斥访问
- 共享变量加锁
- 死锁成因与规避
- Queue 线程安全通信

```python
import threading

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
print(counter)
```

**自查清单**
- [ ] 用 Lock 保护计数
- [ ] 避免竞态
