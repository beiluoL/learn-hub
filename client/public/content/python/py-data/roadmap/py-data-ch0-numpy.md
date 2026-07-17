---
title: NumPy 数组
category: python
module: py-data
subcat: roadmap
timeline: false
level: easy
tier: basic
readMinutes: 12
tags: 数据分析 (NumPy/Pandas/Matplotlib)
summary: 向量化计算的基石
order: 1
---

- ndarray 多维数组
- 向量化运算免循环
- broadcasting 广播
- 切片与 reshape

```python
import numpy as np

a = np.array([1, 2, 3])
b = a * 2
m = a.reshape(1, 3)
print(b, m.shape)
```

**自查清单**
- [ ] 创建 ndarray
- [ ] 做向量化运算
