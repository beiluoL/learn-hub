---
title: functools 进阶
category: python
module: py-fp
subcat: roadmap
timeline: false
level: medium
tier: extra
readMinutes: 12
tags: 函数式特性
summary: partial 与 lru_cache
order: 7
---

- partial 固定部分参数
- lru_cache 记忆化
- 加速递归与重复计算
- cache 单参数简化版

```python
from functools import lru_cache, partial

@lru_cache(maxsize=None)
def fib(n):
    return n if n < 2 else fib(n - 1) + fib(n - 2)

pow2 = partial(pow, 2)
print(fib(30), pow2(10))
```

**自查清单**
- [ ] 用 lru_cache 加速
- [ ] 用 partial 偏应用
