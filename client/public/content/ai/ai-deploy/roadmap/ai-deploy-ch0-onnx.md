---
title: ONNX 导出
category: ai
module: ai-deploy
subcat: roadmap
timeline: false
level: medium
tier: core
readMinutes: 12
tags: "推理部署, onnx, export"
summary: 模型转 ONNX 跨框架
order: 1
---

- 导出为 ONNX
- 检查算子兼容
- 推理一致性

```python
import torch
torch.onnx.export(model, dummy, 'model.onnx',
                 input_names=['x'], output_names=['y'])
```

**自查清单**
- [ ] 导出 ONNX
- [ ] 验证输出
