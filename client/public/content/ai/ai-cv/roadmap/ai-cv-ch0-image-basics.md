---
title: 图像基础
category: ai
module: ai-cv
subcat: roadmap
timeline: false
level: easy
tier: basic
readMinutes: 10
tags: "计算机视觉, cv, basics"
summary: 像素、通道与变换
order: 1
---

- RGB 与灰度
- 图像归一化
- 几何变换

```python
import numpy as np
img = np.random.rand(224, 224, 3).astype('float32')
img = (img - img.mean()) / img.std()
print(img.shape, img.mean())
```

**自查清单**
- [ ] 加载图像
- [ ] 做归一化
