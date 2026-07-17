---
title: 特殊方法 (dunder)
category: python
module: py-oop
subcat: roadmap
timeline: false
level: medium
tier: key
readMinutes: 14
tags: 面向对象
summary: 自定义对象的运算符与表现
order: 4
---

- __str__ / __repr__ 显示
- __len__ / __getitem__ 容器协议
- __eq__ 等值比较
- __call__ 使实例可调用

```python
class Point:
    def __init__(self, x, y):
        self.x, self.y = x, y

    def __repr__(self):
        return f"Point({self.x},{self.y})"

    def __add__(self, other):
        return Point(self.x + other.x, self.y + other.y)

print(Point(1, 2) + Point(3, 4))
```

> 优先实现 __repr__，__str__ 缺省回退到它。

**自查清单**
- [ ] 自定义 __repr__
- [ ] 实现运算符重载
