---
title: 函数、闭包与装饰器
category: python
level: intermediate
readMinutes: 15
tags: "装饰器, 闭包, 高阶函数"
summary: 理解一等函数、闭包原理，手写可用的装饰器与带参装饰器。
order: 2
---

## 一、一等函数与高阶函数

函数是对象，可作为参数、返回值、存入容器：

```
def apply(f, x):
    return f(x)
apply(lambda n: n+1, 10)   # 11
```

## 二、闭包（Closure）

内层函数引用外层变量，且外层已返回，变量被"封存"：

```
def make_counter():
    count = 0
    def counter():
        nonlocal count      # 声明修改外层变量
        count += 1
        return count
    return counter

c = make_counter()
c(); c()   # 1, 2
```

## 三、装饰器（Decorator）

装饰器是"接收函数、返回函数"的高阶函数，用于横切逻辑（日志、计时、鉴权）：

```
import time
def timer(func):
    def wrapper(*args, **kwargs):
        t = time.time()
        res = func(*args, **kwargs)
        print(f"{func.__name__} 耗时 {time.time()-t:.3f}s")
        return res
    return wrapper

@timer
def slow():
    time.sleep(0.5)
```

带参装饰器需要再包一层；用 `functools.wraps` 保留原函数的元信息（name/doc）。
