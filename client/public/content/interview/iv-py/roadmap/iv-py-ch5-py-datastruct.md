---
title: 数据结构与推导式
category: interview
module: iv-py
subcat: roadmap
timeline: false
level: easy
tier: basic
readMinutes: 8
tags: "Python 面试, Python, 数据结构"
summary: 列表/字典/集合推导与生成器
order: 6
---

- 推导式简洁但勿过度嵌套
- 生成器 yield 惰性求值省内存
- defaultdict/Counter 常用

```python
from collections import Counter
c = Counter('aabbc')
print(c)  # Counter({'a':2,'b':2,'c':1})

gen = (x*x for x in range(3))  # 生成器
```

> 生成器表达式与列表推导仅差一层括号。

**自查清单**
- [ ] 能用推导式
- [ ] 能说生成器
