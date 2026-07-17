---
title: 案例：猫狗分类
category: ai
module: ai-cv
subcat: cases
timeline: false
level: hard
tier: key
readMinutes: 24
tags: "计算机视觉, 项目案例"
summary: 迁移学习训练二分类
order: 1
---

- 准备数据集
- 微调 ResNet
- 测试精度

```python
from torchvision.models import resnet18
model = resnet18(weights='DEFAULT')
model.fc = torch.nn.Linear(model.fc.in_features, 2)
print(model.fc)
```

**自查清单**
- [ ] 完成训练
- [ ] 报告精度
