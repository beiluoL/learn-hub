---
title: 复杂度分析
category: python
module: py-dsa
subcat: roadmap
timeline: false
level: medium
tier: basic
readMinutes: 12
tags: 数据结构与算法
summary: 用大 O 衡量效率
order: 1
---

- 时间复杂度与空间复杂度
- 常见 O(1)/O(n)/O(n log n)
- 最坏与平均情况
- 用 cProfile 实测

```python
import cProfile

def loop(n):
    return sum(range(n))

cProfile.run("loop(100000)")
```

**自查清单**
- [ ] 能判断循环复杂度
- [ ] 会用 cProfile
