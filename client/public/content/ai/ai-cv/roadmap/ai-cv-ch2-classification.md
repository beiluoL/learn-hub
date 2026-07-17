---
title: 图像分类
category: ai
module: ai-cv
subcat: roadmap
timeline: false
level: hard
tier: key
readMinutes: 14
tags: "计算机视觉, classification"
summary: CNN 与预训练骨干
order: 3
---

- ResNet 骨干
- 迁移学习
- Top-1 准确率

```python
from torchvision.models import resnet18, ResNet18_Weights
model = resnet18(weights=ResNet18_Weights.DEFAULT)
print(model.fc)
```

**自查清单**
- [ ] 加载骨干
- [ ] 替换分类头
