---
title: 属性与描述符
category: python
module: py-oop
subcat: roadmap
timeline: false
level: medium
tier: key
readMinutes: 12
tags: 面向对象
summary: 用 property 控制访问
order: 5
---

- @property 只读属性
- setter / deleter 控制写入
- 惰性属性缓存
- 描述符协议进阶

```python
class Circle:
    def __init__(self, r):
        self.r = r

    @property
    def area(self):
        return 3.14159 * self.r ** 2

c = Circle(2)
print(c.area)
```

**自查清单**
- [ ] 用 property 暴露计算属性
- [ ] 理解 getter/setter
