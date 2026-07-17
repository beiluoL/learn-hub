---
title: lambda 与内置函数
category: python
module: py-fp
subcat: roadmap
timeline: false
level: easy
tier: core
readMinutes: 10
tags: 函数式特性
summary: 匿名函数配合 map/reduce
order: 2
---

- lambda 单行表达式
- map/filter 转换序列
- functools.reduce 归约
- sorted(key=lambda)

```python
from functools import reduce

nums = [1, 2, 3, 4]
squares = list(map(lambda x: x * x, nums))
total = reduce(lambda a, b: a + b, nums)
print(squares, total)
```

**自查清单**
- [ ] 用 map 映射
- [ ] 用 reduce 求和
