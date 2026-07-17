---
title: 装饰器
category: python
module: py-fp
subcat: roadmap
timeline: false
level: medium
tier: key
readMinutes: 14
tags: 函数式特性
summary: 增强函数行为
order: 5
---

- @decorator 语法糖
-  wraps 保留元信息
- 计时/缓存装饰器
- 带参装饰器三层嵌套

```python
import time
from functools import wraps

def timer(fn):
    @wraps(fn)
    def wrapper(*a, **k):
        t = time.time()
        r = fn(*a, **k)
        print(f"{fn.__name__} 用时 {time.time() - t:.3f}s")
        return r
    return wrapper

@timer
def work():
    return sum(range(100000))
```

> 务必用 @wraps 保留原函数名与文档。

**自查清单**
- [ ] 实现计时装饰器
- [ ] 用 @wraps
