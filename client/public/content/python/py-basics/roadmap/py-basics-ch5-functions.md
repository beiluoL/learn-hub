---
title: 函数定义
category: python
module: py-basics
subcat: roadmap
timeline: false
level: medium
tier: core
readMinutes: 14
tags: Python 基础语法
summary: 参数、返回值与默认参数
order: 6
---

- def 定义函数，return 返回
- 位置参数与关键字参数
- 默认参数与可变参数 *args/**kwargs
- 文档字符串 docstring
- 变量作用域 LEGB 规则

```python
def greet(name, greeting="你好"):
    """返回问候语"""
    return f"{greeting}, {name}!"

def total(*nums):
    return sum(nums)

print(greet("小红"))
print(total(1, 2, 3))
```

> 默认参数不要使用可变对象，如 list 会有共享陷阱。

**自查清单**
- [ ] 能定义带默认参数的函数
- [ ] 会用 *args 接收变长参数
- [ ] 写出可读 docstring
