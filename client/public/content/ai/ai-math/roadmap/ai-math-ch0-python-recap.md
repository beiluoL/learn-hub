---
title: Python 数据科学速览
category: ai
module: ai-math
subcat: roadmap
timeline: false
level: easy
tier: basic
readMinutes: 10
tags: "Python 与数学基础, python, basics"
summary: 复习列表、字典、推导式与函数式工具
order: 1
---

为后续数值计算打基础，重点掌握向量化思维。

- 列表推导式替代循环
- zip/map/enumerate 用法
- 可变与不可变对象区别

```python
nums = [1, 2, 3, 4]
squares = [x * x for x in nums if x % 2 == 0]
print(squares)

pairs = list(zip(['a', 'b'], [1, 2]))
print(pairs)
```

> 避免在热点循环里写纯 Python 循环，优先用 NumPy。

**自查清单**
- [ ] 能写出列表推导
- [ ] 理解深浅拷贝
