---
title: 数据增强
category: ai
module: ai-cv
subcat: roadmap
timeline: false
level: easy
tier: core
readMinutes: 11
tags: "计算机视觉, augment"
summary: 翻转裁剪与色彩抖动
order: 2
---

- 随机翻转裁剪
- 归一化标准化
- 增强防过拟合

```python
from torchvision import transforms
t = transforms.Compose([
    transforms.RandomHorizontalFlip(),
    transforms.ToTensor(),
    transforms.Normalize((0.5,), (0.5,))])
print(t)
```

**自查清单**
- [ ] 写增强管线
- [ ] 理解作用
