---
title: 大模型本地部署与服务化
category: ai
level: advanced
readMinutes: 18
tags: "模型部署, Ollama, vLLM, 量化, GGUF"
summary: 大模型本地部署与服务化方案。
order: 26
prereq: ai/ai-deploy
---

## 大模型部署概述

大型语言模型的部署是 AI 应用落地的关键环节。与传统的 Web 服务不同，LLM 部署面临独特挑战：显存需求巨大（7B 模型 FP16 需约 14GB VRAM）、推理延迟高、并发吞吐量优化复杂。

主流的部署方案分为三类：

| 方案 | 代表工具 | 适用场景 | 特点 |
|------|---------|---------|------|
| 本地运行 | Ollama, llama.cpp | 开发调试、个人使用 | 简单易用、CPU 推理 |
| 高性能推理 | vLLM, TGI | 生产 API 服务 | 高吞吐、低延迟 |
| 边缘部署 | ONNX, CoreML | 移动端/嵌入式 | 平台特定优化 |

## Ollama：本地运行

Ollama 是最简单的本地 LLM 运行方案，一键下载和运行模型，自动处理量化。

```bash
# 安装 Ollama (macOS)
brew install ollama

# 下载并运行模型
ollama pull llama3.2:3b
ollama pull qwen2.5:7b

# 命令行对话
ollama run llama3.2:3b

# 以 API 服务方式运行
ollama serve
```

### REST API 调用

Ollama 启动后自动暴露兼容 OpenAI 格式的 REST API：

```python
import requests
import json

OLLAMA_URL = "http://localhost:11434/api"

def chat_ollama(model: str, prompt: str):
    """Ollama 对话调用"""
    response = requests.post(
        f"{OLLAMA_URL}/chat",
        json={
            "model": model,
            "messages": [
                {"role": "user", "content": prompt}
            ],
            "stream": False,
            "options": {
                "temperature": 0.7,
                "top_p": 0.9,
                "num_ctx": 4096
            }
        }
    )
    return response.json()["message"]["content"]

def generate_embedding(model: str, text: str):
    """使用 Ollama 生成 Embedding"""
    response = requests.post(
        f"{OLLAMA_URL}/embeddings",
        json={"model": model, "prompt": text}
    )
    return response.json()["embedding"]

# 使用示例
response = chat_ollama("qwen2.5:7b", "解释什么是量子计算")
print(response)
```

### Modelfile：自定义模型行为

```dockerfile
# Modelfile
FROM qwen2.5:7b

# 设置系统提示
SYSTEM "你是一个专业的 Python 编程助手，回答简洁直接。"

# 设置参数
PARAMETER temperature 0.7
PARAMETER top_p 0.9
PARAMETER num_ctx 8192

# 创建自定义模型
# ollama create my-python-helper -f Modelfile
```

## vLLM：高吞吐推理

vLLM 是目前生产环境使用最广泛的高性能推理引擎，其核心创新是 PagedAttention 算法。PagedAttention 受操作系统虚拟内存分页机制的启发，将 KV Cache 切分为固定大小的 blocks，避免显存碎片、支持动态批处理。

```bash
# 安装 vLLM
pip install vllm

# 启动兼容 OpenAI API 的推理服务
python -m vllm.entrypoints.openai.api_server \
    --model Qwen/Qwen2.5-7B-Instruct \
    --tensor-parallel-size 1 \
    --max-model-len 8192 \
    --gpu-memory-utilization 0.9 \
    --port 8000
```

### Python SDK 调用

```python
from vllm import LLM, SamplingParams

# 批量推理
llm = LLM(
    model="Qwen/Qwen2.5-7B-Instruct",
    tensor_parallel_size=1,   # GPU 数量
    max_model_len=8192,
    gpu_memory_utilization=0.9
)

sampling_params = SamplingParams(
    temperature=0.7,
    top_p=0.9,
    max_tokens=512,
    stop=["</s>"]
)

prompts = [
    "解释机器学习中的过拟合",
    "如何使用 Python 实现一个简单的 Web 服务器？",
    "量子计算的原理是什么？"
]

outputs = llm.generate(prompts, sampling_params)
for output in outputs:
    print(output.outputs[0].text[:100])
```

### vLLM 参数调优

| 参数 | 说明 | 典型值 |
|------|------|--------|
| max_num_seqs | 最大并发序列数 | 256 |
| max_num_batched_tokens | 每批最大 token 数 | 8192 |
| gpu_memory_utilization | GPU 显存利用率 | 0.85-0.95 |
| enable_prefix_caching | 前缀缓存 | True |

## 量化技术

量化通过降低模型权重的精度来减少显存占用和加速推理，是本地部署的关键技术。

### 主流量化方法

| 方法 | 原理 | 精度 | 显存节省 | 使用场景 |
|------|------|------|---------|---------|
| GPTQ | 训练后量化，逐层优化 | INT4/INT8 | 约 4x | GPU 推理 |
| AWQ | 激活感知量化，保护重要通道 | INT4 | 约 4x | GPU 推理 |
| GGUF | llama.cpp 格式，支持 CPU | Q4/Q5/Q8 | 2-4x | CPU/混合推理 |

### GGUF 与 llama.cpp

GGUF 是 llama.cpp 项目的模型格式，支持 CPU 推理和 CPU+GPU 混合推理。Ollama 底层也使用 llama.cpp。

```bash
# 下载 GGUF 模型 (从 HuggingFace)
huggingface-cli download TheBloke/Llama-3.2-3B-Instruct-GGUF \
    llama-3.2-3b-instruct.Q4_K_M.gguf \
    --local-dir ./models

# 使用 llama.cpp 运行
./llama-cli \
    -m ./models/llama-3.2-3b-instruct.Q4_K_M.gguf \
    -n 512 \
    -t 8 \
    --temp 0.7 \
    -p "你好，介绍一下你自己"
```

GGUF 的量化级别（如 Q4_K_M）含义：数字越小，量化越激进，模型越小但质量下降越多。Q4_K_M 是推荐的平衡点。

## Docker 化部署

```yaml
# docker-compose.yml
version: '3.8'
services:
  vllm-server:
    image: vllm/vllm-openai:latest
    runtime: nvidia
    environment:
      - NVIDIA_VISIBLE_DEVICES=all
    ports:
      - "8000:8000"
    volumes:
      - ~/.cache/huggingface:/root/.cache/huggingface
    command: [
      "--model", "Qwen/Qwen2.5-7B-Instruct",
      "--max-model-len", "8192",
      "--gpu-memory-utilization", "0.9"
    ]
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              count: 1
              capabilities: [gpu]

  api-wrapper:
    build: ./api
    ports:
      - "8080:8080"
    environment:
      - VLLM_URL=http://vllm-server:8000
    depends_on:
      - vllm-server
```

```python
# api/main.py - FastAPI 包装层
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import openai

app = FastAPI()
client = openai.AsyncOpenAI(
    base_url="http://vllm-server:8000/v1",
    api_key="not-needed"
)

class ChatRequest(BaseModel):
    messages: list[dict]
    temperature: float = 0.7
    max_tokens: int = 512

@app.post("/chat")
async def chat(request: ChatRequest):
    try:
        response = await client.chat.completions.create(
            model="Qwen/Qwen2.5-7B-Instruct",
            messages=request.messages,
            temperature=request.temperature,
            max_tokens=request.max_tokens
        )
        return {
            "content": response.choices[0].message.content,
            "tokens_used": response.usage.total_tokens
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
```

## GPU/CPU 资源评估

推理所需显存估算（FP16）：参数量 × 2（字节）。7B 模型需约 14GB，13B 需约 26GB。使用 INT4 量化后约为 FP16 的 1/4。

KV Cache 额外显存：batch_size × sequence_length × num_layers × hidden_dim × 2 bytes。

一个典型的部署配置：7B INT4 量化模型可以在 8GB VRAM 的消费级 GPU 上运行，或在 16GB RAM + Apple M 系列芯片上通过 Metal 加速运行。

## 实际开发中的应用 / 常见问题

### Ollama 和 vLLM 如何选择？

Ollama 适合开发测试和单用户场景，安装配置极简。vLLM 适合生产环境的高并发服务，具有连续批处理、PagedAttention 等优化。

### 量化会损失多少性能？

INT8 量化几乎无损（< 1% 性能下降），INT4 量化在多数任务上有 1%-5% 的性能下降。对于知识问答场景影响较小，对代码生成和数学推理影响相对更大。

### 如何处理 OOM（显存不足）？

排查顺序：降低 max_model_len → 降低 gpu_memory_utilization → 减少 max_num_seqs → 使用 INT4 量化 → 启用 CPU offloading。

### API 服务如何做负载均衡？

vLLM 的 `tensor_parallel_size` 可以将模型分布在多张 GPU 上。对于多节点部署，在前端使用 Nginx 或 HAProxy 做反向代理和负载均衡，多个 vLLM 实例共享模型权重目录。
