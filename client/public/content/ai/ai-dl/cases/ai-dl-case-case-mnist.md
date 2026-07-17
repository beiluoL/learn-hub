---
title: 案例：MNIST 分类
category: ai
module: ai-dl
subcat: cases
timeline: false
level: hard
tier: key
readMinutes: 25
tags: "深度学习, 项目案例"
summary: 用 CNN 训练手写数字识别
order: 1
---

- 构建 CNN
- 训练并监控 loss
- 测试集评估

```python
import torch.nn as nn
model = nn.Sequential(
    nn.Conv2d(1, 8, 3), nn.ReLU(), nn.MaxPool2d(2),
    nn.Flatten(), nn.Linear(1352, 10))
print(model)
```

**自查清单**
- [ ] 训练模型
- [ ] 达到合理精度
