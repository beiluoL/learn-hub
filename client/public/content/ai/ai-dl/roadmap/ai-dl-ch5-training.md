---
title: 训练技巧
category: ai
module: ai-dl
subcat: roadmap
timeline: false
level: medium
tier: core
readMinutes: 13
tags: "深度学习, training"
summary: 优化器、损失与正则
order: 6
---

- Adam/SGD 选择
- 学习率调度
- Dropout 与 BatchNorm

```python
import torch
opt = torch.optim.Adam(model.parameters(), lr=1e-3)
sched = torch.optim.lr_scheduler.CosineAnnealingLR(opt, T_max=10)
```

**自查清单**
- [ ] 配优化器
- [ ] 加正则
