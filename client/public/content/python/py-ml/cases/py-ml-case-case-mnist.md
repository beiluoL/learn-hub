---
title: 手写数字识别
category: python
module: py-ml
subcat: cases
timeline: false
level: hard
tier: key
readMinutes: 30
tags: "ML/DL 基础 (scikit-learn/TensorFlow/PyTorch), 项目案例"
summary: PyTorch 训练 CNN
order: 2
---

- 加载 MNIST 数据
- 定义卷积网络
- 训练若干轮
- 测试准确率

```python
import torch.nn as nn

class Net(nn.Module):
    def __init__(self):
        super().__init__()
        self.conv = nn.Sequential(
            nn.Conv2d(1, 8, 3), nn.ReLU(), nn.Flatten()
        )
        self.fc = nn.Linear(8 * 26 * 26, 10)

    def forward(self, x):
        return self.fc(self.conv(x))
```

**自查清单**
- [ ] 定义 CNN
- [ ] 完成 MNIST 训练
