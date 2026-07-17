---
title: 生成器
category: python
module: py-fp
subcat: roadmap
timeline: false
level: medium
tier: key
readMinutes: 12
tags: 函数式特性
summary: 惰性计算节省内存
order: 4
---

- yield 暂停并产出
- 生成器表达式 (x for x in ...)
- 节省大数据内存
- next() 逐项取值

```python
def count_up(n):
    i = 0
    while i < n:
        yield i
        i += 1

for v in count_up(3):
    print(v)
```

**自查清单**
- [ ] 用 yield 写生成器
- [ ] 理解惰性求值
