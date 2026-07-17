---
title: itertools 工具
category: python
module: py-fp
subcat: roadmap
timeline: false
level: medium
tier: extra
readMinutes: 11
tags: 函数式特性
summary: 高效迭代器组合
order: 6
---

- chain 串联多个迭代
- combinations/permutations
- groupby 分组
- islice 切片迭代

```python
from itertools import combinations

for c in combinations("ABC", 2):
    print(c)
```

**自查清单**
- [ ] 用 combinations 取组合
- [ ] 理解迭代器惰性
