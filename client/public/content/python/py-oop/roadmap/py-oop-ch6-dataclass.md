---
title: dataclasses 与枚举
category: python
module: py-oop
subcat: roadmap
timeline: false
level: medium
tier: core
readMinutes: 13
tags: 面向对象
summary: 简化数据类与枚举定义
order: 7
---

- @dataclass 自动生成方法
- field() 定制字段
- Enum 定义有限集合
- frozen 不可变数据类

```python
from dataclasses import dataclass
from enum import Enum

class Color(Enum):
    RED = 1
    GREEN = 2

@dataclass
class User:
    name: str
    age: int

print(User("tom", 20), Color.RED)
```

**自查清单**
- [ ] 用 dataclass 定义数据类
- [ ] 用 Enum 约束取值
