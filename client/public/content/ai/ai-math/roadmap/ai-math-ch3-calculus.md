---
title: 微积分与梯度
category: ai
module: ai-math
subcat: roadmap
timeline: false
level: medium
tier: core
readMinutes: 13
tags: "Python 与数学基础, calculus, optim"
summary: 导数、偏导数与梯度下降直觉
order: 4
---

- 导数即变化率
- 梯度指向上升最快方向
- 学习率对收敛的影响

```python
def grad_desc(lr=0.1, steps=20):
    x = 5.0
    for _ in range(steps):
        g = 2 * x          # f(x)=x^2 的导数
        x = x - lr * g
    return x

print(grad_desc())
```

**自查清单**
- [ ] 理解梯度下降更新公式
- [ ] 调过学习率
