---
title: 一等函数
category: python
module: py-fp
subcat: roadmap
timeline: false
level: easy
tier: basic
readMinutes: 11
tags: 函数式特性
summary: 函数可作变量传递
order: 1
---

- 函数赋值给变量
- 作为参数与返回值
- 闭包捕获外部变量
- 高阶函数 map/filter

```python
def make_adder(n):
    def adder(x):
        return x + n
    return adder

add5 = make_adder(5)
print(add5(10))
```

**自查清单**
- [ ] 理解闭包
- [ ] 函数可作返回值
