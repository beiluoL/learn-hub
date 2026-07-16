---
question: 什么是装饰器？请写出一个带参数的装饰器并说明执行顺序。
category: python
difficulty: middle
tags: "装饰器, 闭包"
order: 6
---

**装饰器：**接收函数、返回新函数的高阶函数，用于在不改原函数代码的前提下添加功能（日志、计时、鉴权）。

**带参装饰器（三层嵌套）：**

```
def repeat(n):
    def deco(func):
        def wrapper(*a, **k):
            return [func(*a, **k) for _ in range(n)]
        return wrapper
    return deco

@repeat(3)
def hi(): return "hi"
hi()  # ['hi','hi','hi']
```

**执行顺序：**repeat(3) → 返回 deco → @deco 包裹 hi → 得到 wrapper。建议用 functools.wraps 保留原函数元信息。
