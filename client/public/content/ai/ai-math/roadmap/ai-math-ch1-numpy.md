---
title: NumPy 基础
category: ai
module: ai-math
subcat: roadmap
timeline: false
level: easy
tier: basic
readMinutes: 12
tags: "Python 与数学基础, numpy"
summary: ndarray 创建、切片与广播机制
order: 2
---

NumPy 是几乎所有 AI 库的地基。

- ndarray 的 shape 与 dtype
- 布尔索引与花式索引
- 广播（broadcasting）规则

```python
import numpy as np
arr = np.array([1, 2, 3])
print(arr.mean(), arr.std())

m = np.arange(9).reshape(3, 3)
print(m[:2, 1:])
print(m + np.array([10, 20, 30]))
```

**自查清单**
- [ ] 能 reshape 与索引
- [ ] 理解广播
