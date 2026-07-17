---
title: 实现线程安全单例
category: interview
module: iv-py
subcat: cases
timeline: false
level: hard
tier: key
readMinutes: 14
tags: "Python 面试, 项目案例"
summary: 用装饰器或元类实现 Python 单例
order: 2
---

- 模块级变量天然单例
- 装饰器缓存实例
- __new__ 控制创建

```python
def singleton(cls):
    inst = {}
    def get(*a, **k):
        if cls not in inst:
            inst[cls] = cls(*a, **k)
        return inst[cls]
    return get

@singleton
class DB: pass
```

**自查清单**
- [ ] 单例正确
- [ ] 线程安全可加分
