---
title: 实例、类与静态方法
category: python
module: py-oop
subcat: roadmap
timeline: false
level: easy
tier: core
readMinutes: 10
tags: 面向对象
summary: 区分三种方法装饰器
order: 2
---

- @staticmethod 无 self
- @classmethod 首个参数为 cls
- 实例方法访问 self
- 何时使用类方法创建工厂

```python
class Tool:
    @staticmethod
    def add(a, b):
        return a + b

    @classmethod
    def make(cls, x):
        return cls(x)

print(Tool.add(1, 2))
```

**自查清单**
- [ ] 会用 staticmethod
- [ ] 理解 classmethod 的 cls
