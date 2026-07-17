---
title: 神经元与感知机
category: ai
module: ai-dl
subcat: roadmap
timeline: false
level: easy
tier: basic
readMinutes: 10
tags: "深度学习, dl, basics"
summary: 线性组合加激活函数
order: 1
---

- 加权求和与偏置
- 激活函数作用
- 单层表达力局限

```python
import numpy as np
def neuron(x, w, b):
    return np.maximum(0, x @ w + b)   # ReLU
print(neuron(np.array([1, 2]), np.array([0.5, -1]), 0.1))
```

**自查清单**
- [ ] 实现前向计算
- [ ] 认识 ReLU
