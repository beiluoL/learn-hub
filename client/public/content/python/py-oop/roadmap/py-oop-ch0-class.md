---
title: 类与对象
category: python
module: py-oop
subcat: roadmap
timeline: false
level: easy
tier: basic
readMinutes: 11
tags: 面向对象
summary: 用 class 封装数据与行为
order: 1
---

- class 定义类，__init__ 初始化
- self 指向实例自身
- 实例属性与方法
- 用对象组织相关数据

```python
class Dog:
    def __init__(self, name):
        self.name = name

    def bark(self):
        return f"{self.name}: 汪汪"

d = Dog("阿黄")
print(d.bark())
```

**自查清单**
- [ ] 能定义类并创建实例
- [ ] 理解 self 作用
