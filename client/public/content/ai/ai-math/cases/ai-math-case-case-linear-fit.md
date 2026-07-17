---
title: 案例：最小二乘线性回归
category: ai
module: ai-math
subcat: cases
timeline: false
level: medium
tier: key
readMinutes: 20
tags: "Python 与数学基础, 项目案例"
summary: 从零实现一元线性回归并可视化
order: 1
---

- 构造带噪声数据
- 解析解求权重
- 评估 MSE

```python
import numpy as np
x = np.linspace(0, 10, 100)
y = 2 * x + 1 + np.random.randn(100)
X = np.vstack([x, np.ones_like(x)]).T
w = np.linalg.inv(X.T @ X) @ X.T @ y
print('slope, bias:', w)
```

**自查清单**
- [ ] 实现拟合
- [ ] 计算误差
