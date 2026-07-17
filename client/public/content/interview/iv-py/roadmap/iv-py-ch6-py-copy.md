---
title: 深浅拷贝
category: interview
module: iv-py
subcat: roadmap
timeline: false
level: easy
tier: basic
readMinutes: 7
tags: "Python 面试, Python, 拷贝"
summary: copy 与 deepcopy 的差异
order: 7
---

- 赋值只是引用
- 浅拷贝复制一层，嵌套对象共享
- 深拷贝递归复制全部

```python
import copy
a = [[1], [2]]
b = copy.copy(a)
c = copy.deepcopy(a)
a[0][0] = 9
print(b[0][0], c[0][0])  # 9 1
```

> 深拷贝可能遇循环引用，copy 模块已处理。

**自查清单**
- [ ] 能说差异
- [ ] 能举例
