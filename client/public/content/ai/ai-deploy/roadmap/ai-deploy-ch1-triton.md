---
title: Triton 推理服务
category: ai
module: ai-deploy
subcat: roadmap
timeline: false
level: hard
tier: key
readMinutes: 15
tags: "推理部署, triton, serving"
summary: 多模型并发与批处理
order: 2
---

- 模型仓库结构
- 动态批处理
- ensemble 编排

```yaml
name: "resnet"
platform: "onnxruntime_onnx"
max_batch_size: 32
dynamic_batching:
  preferred_batch_size: [8, 16]
```

**自查清单**
- [ ] 写配置
- [ ] 启动服务
