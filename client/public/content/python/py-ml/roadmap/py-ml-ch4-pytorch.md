---
title: PyTorch 张量与反向传播
category: python
module: py-ml
subcat: roadmap
timeline: false
level: hard
tier: key
readMinutes: 17
tags: "ML/DL 基础 (scikit-learn/TensorFlow/PyTorch)"
summary: 动态图训练循环
order: 5
---

- torch.Tensor 计算图
- nn.Module 定义网络
- loss.backward 求梯度
- optimizer.step 更新

```python
import torch, torch.nn as nn

model = nn.Linear(10, 1)
opt = torch.optim.SGD(model.parameters(), lr=0.01)
x, y = torch.randn(32, 10), torch.randn(32, 1)
loss = nn.MSELoss()(model(x), y)
opt.zero_grad()
loss.backward()
opt.step()
```

**自查清单**
- [ ] 定义网络
- [ ] 手动训练一步
