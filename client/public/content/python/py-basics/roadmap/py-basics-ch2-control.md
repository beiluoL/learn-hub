---
title: 流程控制
category: python
module: py-basics
subcat: roadmap
timeline: false
level: easy
tier: core
readMinutes: 11
tags: Python 基础语法
summary: if/for/while 控制程序走向
order: 3
---

- if / elif / else 条件分支
- for 遍历可迭代对象
- while 循环与 break/continue
- range() 生成数字序列
- 缩进决定代码块归属

```python
for i in range(5):
    if i % 2 == 0:
        print(f"{i} 是偶数")
    else:
        continue

n = 0
while n < 3:
    print(n)
    n += 1
```

**自查清单**
- [ ] 能用 for 输出 0-4
- [ ] 理解 break 与 continue 区别
- [ ] 代码缩进一致无报错
