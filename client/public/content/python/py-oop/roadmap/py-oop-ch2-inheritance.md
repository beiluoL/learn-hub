---
title: 继承与多态
category: python
module: py-oop
subcat: roadmap
timeline: false
level: medium
tier: core
readMinutes: 13
tags: 面向对象
summary: 子类复用并扩展父类
order: 3
---

- class Child(Parent) 继承
- super() 调用父类方法
- 方法重写实现多态
- isinstance() 类型判断

```python
class Animal:
    def speak(self):
        return "..."

class Cat(Animal):
    def speak(self):
        return "喵"

print(Cat().speak())
print(isinstance(Cat(), Animal))
```

**自查清单**
- [ ] 能实现子类重写
- [ ] 理解 super()
- [ ] 用 isinstance 判断类型
