---
title: 装饰器
category: interview
module: iv-py
subcat: roadmap
timeline: false
level: medium
tier: core
readMinutes: 9
tags: "Python 面试, Python, 装饰器"
summary: 函数装饰器、类装饰器与 functools.wraps
order: 1
---

- 装饰器是高阶函数，接收函数返回新函数
- 叠加装饰器由内向外执行
- functools.wraps 保留原函数元信息

```python
import functools

def log(func):
    @functools.wraps(func)
    def wrapper(*a, **k):
        print('call', func.__name__)
        return func(*a, **k)
    return wrapper

@log
def add(x, y): return x + y
```

> 带参装饰器需再包一层闭包。

**自查清单**
- [ ] 能写装饰器
- [ ] 能说 wraps 作用
