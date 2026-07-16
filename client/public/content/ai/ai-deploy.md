---
title: 模型部署与推理优化
category: ai
level: advanced
readMinutes: 17
tags: "部署, 推理, 量化, GPU"
summary: 把大模型高效、低成本地部署到线上服务。
order: 5
---

## 一、部署形态

-   **API 托管**：调用云端大模型 API（最快上手，按量付费）
-   **私有化部署**：自托管开源模型（Llama、Qwen 等），数据可控
-   **边缘/端侧**：小模型量化后跑在手机/嵌入式

## 二、推理优化手段

-   **量化**：FP16 → INT8/INT4，显存与速度显著改善（精度略降）
-   **KV Cache**：缓存注意力键值，避免重复计算
-   **批处理（Continuous Batching）**：合并多个请求提升吞吐
-   **推理框架**：vLLM（PagedAttention）、TensorRT-LLM、Ollama、llama.cpp

## 三、成本与监控

关注 TTFT（首 token 延迟）、TPS（生成速度）、并发与显存占用。用 token 计费时要控制上下文长度，开启流式输出改善体感。

```
# vLLM 启动示例
python -m vllm.entrypoints.openai.api_server \
  --model Qwen/Qwen2.5-7B --dtype auto --gpu-memory-utilization 0.9
```
