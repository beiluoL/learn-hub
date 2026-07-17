---
title: GIL 全局解释器锁
category: interview
module: iv-py
subcat: roadmap
timeline: false
level: hard
tier: key
readMinutes: 11
tags: "Python 面试, Python, GIL"
summary: GIL 成因、影响与绕过方式
order: 2
---

- GIL 保证同一时刻只有一个线程执行字节码
- CPU 密集型多线程无法利用多核
- IO 密集型受 GIL 影响小
- 多进程(multiprocessing)或 C 扩展可绕过

```python
from multiprocessing import Pool

def f(x): return x * x
with Pool(4) as p:
    print(p.map(f, [1, 2, 3]))
```

> GIL 是 CPython 实现细节，非语言规范。

**自查清单**
- [ ] 能说 GIL 影响
- [ ] 能说绕过方案
