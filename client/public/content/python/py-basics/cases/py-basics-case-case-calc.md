---
title: 命令行计算器
category: python
module: py-basics
subcat: cases
timeline: false
level: easy
tier: basic
readMinutes: 20
tags: "Python 基础语法, 项目案例"
summary: 实现一个支持四则运算的小工具
order: 1
---

- 接收用户输入两个数字与运算符
- 用 if/elif 分发计算逻辑
- 处理除零等异常输入
- 循环交互直到退出

```python
def calc(a, b, op):
    if op == "+":
        return a + b
    if op == "-":
        return a - b
    if op == "*":
        return a * b
    if op == "/":
        return a / b if b != 0 else None
    return None

print(calc(3, 4, "+"))
```

**自查清单**
- [ ] 能正确计算加减乘除
- [ ] 除零时返回 None 不崩溃
