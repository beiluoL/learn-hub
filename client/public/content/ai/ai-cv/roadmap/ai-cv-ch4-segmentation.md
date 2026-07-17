---
title: 图像分割
category: ai
module: ai-cv
subcat: roadmap
timeline: false
level: hard
tier: key
readMinutes: 15
tags: "计算机视觉, segmentation"
summary: 语义与实例分割
order: 5
---

- 像素级分类
- U-Net 结构
- Mask R-CNN

```python
import torchvision
model = torchvision.models.segmentation.deeplabv3_resnet50(weights='DEFAULT')
print(model.backbone)
```

**自查清单**
- [ ] 加载分割模型
- [ ] 理解掩码
