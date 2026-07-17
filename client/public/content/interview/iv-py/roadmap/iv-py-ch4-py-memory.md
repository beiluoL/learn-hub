---
title: 内存管理与垃圾回收
category: interview
module: iv-py
subcat: roadmap
timeline: false
level: medium
tier: core
readMinutes: 10
tags: "Python 面试, Python, GC"
summary: 引用计数、循环引用与 GC
order: 5
---

- 主要用引用计数，归零即回收
- 循环引用由分代垃圾回收器处理
- gc 模块可手动触发与调参

```python
import gc
gc.collect()  # 手动回收循环引用
print(gc.get_threshold())
```

> sys.getrefcount 会临时 +1，注意解读。

**自查清单**
- [ ] 能说引用计数
- [ ] 能说循环引用
