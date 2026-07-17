---
title: 多层网络与反向传播
category: ai
module: ai-dl
subcat: roadmap
timeline: false
level: hard
tier: core
readMinutes: 16
tags: "深度学习, backprop, torch"
summary: 链式法则与梯度计算
order: 2
---

- 前向与反向传播
- 链式法则直觉
- 梯度消失问题

```python
import torch
x = torch.randn(8, 4, requires_grad=True)
w = torch.randn(4, 2)
y = x @ w
loss = y.pow(2).mean()
loss.backward()
print(x.grad.shape)
```

**自查清单**
- [ ] 理解反向传播
- [ ] 看梯度形状
