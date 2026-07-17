---
title: 推理与服务
category: ai
module: ai-llm
subcat: roadmap
timeline: false
level: medium
tier: core
readMinutes: 12
tags: "大模型 LLM, serving"
summary: vLLM 与流式输出
order: 5
---

- 批处理提升吞吐
- 流式生成
- KV Cache 概念

```bash
python -m vllm.entrypoints.openai.api_server \
  --model Qwen/Qwen2-7B-Instruct \
  --port 8000
```

**自查清单**
- [ ] 启动服务
- [ ] 理解吞吐
