---
title: 容器类型
category: python
module: py-basics
subcat: roadmap
timeline: false
level: medium
tier: core
readMinutes: 13
tags: Python 基础语法
summary: 列表、元组、字典与集合
order: 5
---

- list 可变有序序列
- tuple 不可变有序序列
- dict 键值映射，3.7+ 保序
- set 去重与集合运算
- 推导式快速生成容器

```python
nums = [1, 2, 3, 2]
squares = [n * n for n in nums]
unique = set(nums)
d = {"a": 1, "b": 2}
print(squares, unique, d.get("a"))
```

**自查清单**
- [ ] 会写列表推导式
- [ ] 理解 list 与 tuple 区别
- [ ] 用 set 去重
