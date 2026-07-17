---
title: 目标检测
category: ai
module: ai-cv
subcat: roadmap
timeline: false
level: hard
tier: key
readMinutes: 15
tags: "计算机视觉, detection"
summary: "YOLO/SSD/Faster R-CNN"
order: 4
---

- 边界框与锚框
- NMS 非极大抑制
- mAP 评估

```python
import torchvision
model = torchvision.models.detection.fasterrcnn_resnet50_fpn(weights='DEFAULT')
model.eval()
print(model)
```

**自查清单**
- [ ] 加载检测模型
- [ ] 理解 mAP
