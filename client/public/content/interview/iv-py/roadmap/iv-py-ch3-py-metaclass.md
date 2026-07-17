---
title: 元类与鸭子类型
category: interview
module: iv-py
subcat: roadmap
timeline: false
level: hard
tier: extra
readMinutes: 13
tags: "Python 面试, Python, 元类"
summary: type 创建类、元类与动态特性
order: 4
---

- 类本身由 type 创建
- 元类通过 __new__/__init__ 控制类创建
- Python 弱类型、鸭子类型：关注行为而非类型

```python
class Meta(type):
    def __new__(mcs, n, b, d):
        d['tag'] = 'x'
        return super().__new__(mcs, n, b, d)

class A(metaclass=Meta): pass
print(A.tag)
```

> 元类常用于 ORM 字段注册等场景。

**自查清单**
- [ ] 能说元类
- [ ] 能说鸭子类型
