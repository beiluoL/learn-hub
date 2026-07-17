---
title: 变量与基本类型
category: python
module: py-basics
subcat: roadmap
timeline: false
level: easy
tier: basic
readMinutes: 10
tags: Python 基础语法
summary: 理解变量、数字、字符串与布尔类型
order: 2
---

- 变量无需声明类型，动态赋值
- int / float / bool / str 四种基础类型
- 字符串支持 f-string 插值
- type() 查看对象类型
- None 表示空值

```python
name = "小明"
age = 18
score = 95.5
active = True
print(f"{name} 今年 {age} 岁，成绩 {score}")

from typing import Optional
x: Optional[int] = None
```

**自查清单**
- [ ] 能区分 int 与 float
- [ ] 会使用 f-string 格式化输出
- [ ] 理解 None 的含义
