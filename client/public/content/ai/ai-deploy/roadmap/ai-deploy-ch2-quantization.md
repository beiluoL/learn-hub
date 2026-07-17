---
title: 模型量化
category: ai
module: ai-deploy
subcat: roadmap
timeline: false
level: hard
tier: key
readMinutes: 14
tags: "推理部署, quantization"
summary: INT8/FP16 与权重量化
order: 3
---

- PTQ 与 QAT
- 量化压缩比
- 精度损失评估

```python
import torch.quantization as q
model.qconfig = q.get_default_qconfig('fbgemm')
model = q.prepare(model)
model = q.convert(model)
```

**自查清单**
- [ ] 量化模型
- [ ] 测精度
