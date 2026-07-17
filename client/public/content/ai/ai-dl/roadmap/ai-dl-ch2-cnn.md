---
title: 卷积神经网络
category: ai
module: ai-dl
subcat: roadmap
timeline: false
level: hard
tier: key
readMinutes: 15
tags: "深度学习, cnn, cv"
summary: 卷积、池化与特征图
order: 3
---

- 卷积提取局部特征
- 池化降维
- 通道与感受野

```python
import torch.nn as nn
conv = nn.Conv2d(3, 16, kernel_size=3, padding=1)
pool = nn.MaxPool2d(2)
out = pool(conv(torch.randn(1, 3, 32, 32)))
print(out.shape)
```

**自查清单**
- [ ] 搭 CNN 块
- [ ] 算输出尺寸
