---
title: 线性代数
category: ai
module: ai-math
subcat: roadmap
timeline: false
level: medium
tier: core
readMinutes: 14
tags: "Python 与数学基础, math, linalg"
summary: 矩阵乘法、转置、逆与特征分解
order: 3
---

- 矩阵乘法 @ 的几何意义
- 转置与单位阵
- 特征值分解与 SVD 直觉

```python
import numpy as np
A = np.array([[1, 2], [3, 4]])
print(A.T)
print(A @ A.T)

w, v = np.linalg.eig(A)
print(w)
```

> SVD 在降维与推荐系统中频繁出现。

**自查清单**
- [ ] 会做矩阵乘法
- [ ] 知道特征值含义
