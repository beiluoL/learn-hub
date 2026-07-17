---
title: 推导式
category: python
module: py-fp
subcat: roadmap
timeline: false
level: easy
tier: core
readMinutes: 9
tags: 函数式特性
summary: 列表/字典/集合推导
order: 3
---

- 列表推导 [x for x in ...]
- 字典推导 {k: v for ...}
- 集合推导去重
- 带 if 条件过滤

```python
words = ["a", "bb", "ccc"]
d = {w: len(w) for w in words if len(w) > 1}
print(d)
```

**自查清单**
- [ ] 写字典推导
- [ ] 带条件过滤
