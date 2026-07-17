---
title: 视觉预训练
category: ai
module: ai-cv
subcat: roadmap
timeline: false
level: hard
tier: extra
readMinutes: 14
tags: "计算机视觉, vit"
summary: ViT 与自监督
order: 6
---

- 图像分块序列化
- 对比学习
- MAE 掩码重建

```python
from torchvision.models import vit_b_16, ViT_B_16_Weights
model = vit_b_16(weights=ViT_B_16_Weights.DEFAULT)
print(model.heads.head.in_features)
```

**自查清单**
- [ ] 用 ViT
- [ ] 理解分块
