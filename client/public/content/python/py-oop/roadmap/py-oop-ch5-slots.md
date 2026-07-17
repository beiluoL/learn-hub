---
title: __slots__ 与性能
category: python
module: py-oop
subcat: roadmap
timeline: false
level: hard
tier: extra
readMinutes: 11
tags: 面向对象
summary: 限制属性节省内存
order: 6
---

- __slots__ 禁止动态属性
- 显著减少实例内存占用
- 适用大量实例场景
- 会与某些特性冲突

```python
class Point:
    __slots__ = ("x", "y")
    def __init__(self, x, y):
        self.x, self.y = x, y

p = Point(1, 2)
print(p.x)
```

**自查清单**
- [ ] 用 __slots__ 定义类
- [ ] 理解其内存收益
