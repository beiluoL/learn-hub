---
title: 推理优化
category: ai
module: ai-deploy
subcat: roadmap
timeline: false
level: hard
tier: key
readMinutes: 14
tags: "推理部署, optimization"
summary: 算子融合与 KV Cache
order: 5
---

- 图优化
- TensorRT 加速
- 显存复用

```bash
trtexec --onnx=model.onnx --saveEngine=model.engine \
  --fp16 --workspace=2048
```

**自查清单**
- [ ] 跑 TensorRT
- [ ] 对比延迟
