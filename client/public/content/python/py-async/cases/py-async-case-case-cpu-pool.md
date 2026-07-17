---
title: CPU 密集并行计算
category: python
module: py-async
subcat: cases
timeline: false
level: hard
tier: key
readMinutes: 28
tags: "异步与并发 (asyncio/多线程/多进程), 项目案例"
summary: 多进程加速计算
order: 2
---

- 拆分计算任务
- 进程池并行执行
- 汇总结果
- 对比单进程耗时

```python
from multiprocessing import Pool
import math

def heavy(n):
    return sum(math.sqrt(i) for i in range(n))

if __name__ == "__main__":
    with Pool() as p:
        print(p.map(heavy, [100000] * 4))
```

> 多进程代码放在 if __name__ == "__main__" 下避免递归派生。

**自查清单**
- [ ] 进程池并行
- [ ] 正确汇总结果
