---
question: 大模型推理加速有哪些方法？vLLM 的 PagedAttention 原理是什么？
category: ai
difficulty: hard
tags: "推理优化, vLLM, 量化, PagedAttention, KV Cache"
order: 43
---

大模型推理的核心瓶颈是**显存带宽**而非计算。vLLM 的 PagedAttention 借鉴了操作系统中虚拟内存的分页思想，将 KV Cache 切分为固定大小的 Block，通过非连续物理存储实现了近零碎的显存利用率——这是当前生产环境中最有效的推理加速方案之一，可将吞吐量提升 2-4 倍。

## 推理瓶颈分析

### 显存带宽是真正的瓶颈

LLM 推理是典型的**显存带宽受限型（memory-bound）**任务:

```
# 一个直观的计算
# Llama-2 7B: 参数约 14GB (FP16)
# A100 的 HBM 带宽: ~2TB/s
# 生成一个 token 需要读取所有参数一次
# 理论最大生成速度: 2TB / 14GB ≈ 140 tokens/s

# 但实际上远低于此，因为:
# 1. KV Cache 读写消耗额外带宽
# 2. 内存访问模式不是完全顺序的
# 3. 批处理时多个请求共享参数读取，但 KV Cache 是独立的
```

### 瓶颈拆解

| 组件的显存占用 | 占比 | 优化方向 |
|---|---|---|
| 模型权重 | 70-90% | 量化（INT8/INT4） |
| KV Cache | 10-30% | PagedAttention / KV Cache 压缩 |
| 激活值 & 临时 | <5% | Flash Attention / 算子融合 |

## KV Cache：原理与问题

### KV Cache 为什么必要

在自回归生成中，每次生成下一个 token 时，之前所有 token 的 K 和 V 矩阵是不变的:

```
生成 token_1: 计算 K_0, V_0 → 用于生成 token_1
生成 token_2: 计算 K_1, V_1 → 需要 K_0, V_0, K_1, V_1
生成 token_3: 计算 K_2, V_2 → 需要 K_0, V_0, K_1, V_1, K_2, V_2
```

如果不缓存，每次都要重新计算所有历史 K/V——计算量按 O(n²) 增长。KV Cache 避免了这种重复计算。

### KV Cache 的显存问题

KV Cache 是推理过程中显存浪费的"重灾区":

```
KV Cache 显存 = 2 × n_layers × seq_len × d_model × dtype_size

# 具体例子: Llama-2 7B
# n_layers = 32, d_model = 4096, dtype = FP16
# 对于一条 2048 token 的请求:
# KV Cache = 2 × 32 × 2048 × 4096 × 2 bytes = 1 GB
# 批处理 8 条请求: 8 GB
```

核心问题: 现有框架**预分配**连续显存给 KV Cache，按最大长度预留。如果实际只用了 500 tokens，剩余 1548 tokens 的显存就浪费了——这被称为内部碎片。更糟的是，预分配导致并发能力受限: 显存被没填满的 KV Cache 槽位占着，新的请求进不来。

## PagedAttention：操作系统的智慧

vLLM 的核心创新 PagedAttention 解决的就是上述显存碎片问题:

### 核心思想

将 KV Cache 从"整块预分配"改为"按需分页":

```
传统方式:
请求 A: [============预留 2048 slots============]
请求 B: [============预留 2048 slots============]
# 每个请求独占一大块连续显存

PagedAttention:
Block Pool: [Blk0][Blk1][Blk2][Blk3][Blk4][Blk5][Blk6][Blk7]
请求 A:     [Blk0]->[Blk2]->[Blk5]  (3 blocks, 动态分配)
请求 B:     [Blk1]->[Blk3]          (2 blocks, 动态分配)
# Blocks 是固定大小的（如 16 tokens）
# 逻辑连续，物理可以不连续
```

**类比**: 操作系统中的虚拟内存分页。进程看到的地址空间是连续的，但物理页可以是碎片化的。PagedAttention 的 Block Table 就是"页表"。

### 数据结构

```python
# PagedAttention 的核心数据结构（简化版）
class BlockTable:
    """逻辑块到物理块的映射表"""
    def __init__(self, max_blocks):
        self.physical_blocks = []  # [block_id_1, block_id_2, ...]

class BlockManager:
    """全局的块分配器"""
    def __init__(self, num_blocks, block_size):
        self.free_blocks = list(range(num_blocks))
        self.block_size = block_size  # 通常 16 tokens

    def allocate(self, num_blocks):
        allocated = self.free_blocks[:num_blocks]
        self.free_blocks = self.free_blocks[num_blocks:]
        return allocated

    def free(self, blocks):
        self.free_blocks.extend(blocks)
```

### 为什么 Block Size 选 16？

- 太大: 内部碎片回升。
- 太小: Block Table 本身开销变大，GPU kernel 并行度下降。
- 16 是实验折中——通常一个 token 的 KV Cache 约 0.5MB，16 tokens 约 8MB，是一个合理的分配粒度。

### PagedAttention 的额外能力

1. **Prefix Sharing**: 多个请求共享相同的 System Prompt 时，KV Cache 可以共享（如 LLM-as-a-Service 平台中，所有请求的 System Prompt 相同）。
2. **Beam Search**: 不同 beam 共享祖先序列的 KV Cache，只复制最后一层。
3. **Flexible Scheduling**: 动态内存管理使调度器可以在显存碎片中"挤入"更多并发请求。

## Continuous Batching：告别静态批处理

传统批处理: 一批请求全部完成后才开始下一批。最慢的请求拖慢整批。

Continuous Batching: 每生成一个 token，检查是否有完成的请求。有就踢出，立刻补充新请求进同一批次:

```
时间 →
Batch Slot 0: [Req A: tok1]→[tok2]→[tok3]→[完成!]→[Req D: tok1]→[tok2]→...
Batch Slot 1: [Req B: tok1]→[完成!]→[Req E: tok1]→[tok2]→[tok3]→...
Batch Slot 2: [Req C: tok1]→[tok2]→[tok3]→[tok4]→[完成!]→[Req F: tok1]→...
```

Continuous Batching 使 GPU 利用率从 30-50% 提升到 80-90%，吞吐量提升 2-3 倍。

## 量化：降低参数精度

### GPTQ（训练后量化）

基于 Optimal Brain Surgeon 思想，逐层量化并对剩余权重做误差补偿:

```python
# GPTQ 的简化示意
for layer in model.layers:
    for col in layer.columns:
        # 对该通道做 INT4 量化
        quantized_weight[col] = round(weight[col] / scale)
        # 计算量化误差
        error = weight[col] - quantized_weight[col] * scale
        # 将误差补偿到未量化的剩余列上
        weight[remaining_cols] -= compensation(error)
```

- 优点: 精度损失极小（INT4 下 <1% 困惑度提升）。
- 缺点: 量化过程慢（需要校准数据）。

### AWQ（Activation-Aware Weight Quantization）

核心发现: 不是所有权重对推理同等重要——对激活值大的通道保留更高精度（salient channels）。

```python
# AWQ 的核心逻辑
for channel in weight_channels:
    if activation_magnitude[channel] > threshold:
        # 显著性通道: FP16 保留
        keep_fp16(channel)
    else:
        # 非显著性通道: INT4 量化
        quantize_to_int4(channel)
```

### GGUF（面向消费级硬件的格式）

GGUF（由 llama.cpp 项目演变）针对 CPU 推理 + 混合精度设计:
- 支持 offload 部分层到 GPU（剩下在 CPU 用 AVX2/NEON 加速）。
- K-Quant 量化: 对不同类型的权重用不同精度的量化策略。
- 使 7B 模型可以在 8GB 显存的消费级显卡上运行，或在 32GB RAM 的 MacBook 上用 CPU 推理。

### 量化方案对比

| 方案 | 精度 | 硬件 | 推理速度 | 适用场景 |
|---|---|---|---|---|
| GPTQ INT4 | 高 | GPU | 快 | 服务器 GPU 推理 |
| AWQ INT4 | 高 | GPU | 快 | 服务器 GPU 推理 |
| GGUF Q4_K_M | 中 | CPU/混合 | 中 | 消费级设备/边缘 |
| BitsAndBytes NF4 | 中 | GPU | 中 | 实验/微调时的显存优化 |

## Flash Attention：IO 感知的精确注意力

### 问题

标准 Self-Attention 的计算图会产生巨大的中间矩阵:

```
Q @ K^T: (seq_len × d_model) @ (d_model × seq_len) → (seq_len × seq_len)
存储在 HBM（高带宽显存）中，seq_len = 4096 → 16M floats → 64MB

然后 Softmax(QK^T) @ V: 再读回 HBM 中的矩阵
```

HBM 带宽 2TB/s，但实际有效带宽利用率不足 40%，因为大量时间花在读/写中间矩阵。

### Flash Attention 解决方案

将 Attention 计算**分块**，用 GPU 的 SRAM（比 HBM 快 10 倍，但容量极小）做局部计算:

```
# Flash Attention 的核心技巧（伪代码）
for i in range(0, seq_len, BLOCK_SIZE):
    # 在 SRAM 中加载 Q 的一个块
    Q_block = load_q_block(i)
    for j in range(0, seq_len, BLOCK_SIZE):
        # 在 SRAM 中加载 K, V 的一个块
        K_block, V_block = load_kv_block(j)
        # 在 SRAM 中计算局部的 Attention (Q_block @ K_block^T)
        local_scores = Q_block @ K_block.T
        # Online Softmax: 不需要完整矩阵就能算 Softmax
        local_softmax = online_softmax(local_scores, running_stats)
        # 局部加权求和
        output[i] += local_softmax @ V_block
    # 结果写回 HBM
    save(output[i])
```

**优势**: 将 HBM 读写量从 O(n²) 降低到 O(n² / BLOCK_SIZE)，且在 SRAM 中计算速度快 10 倍。实现后不仅快还省显存——不再在 HBM 中保留完整的 (seq_len × seq_len) 矩阵。

多款主流框架（PyTorch 2.0 SDPA / xformers / vLLM）都内置了 Flash Attention。

## Tensor Parallelism + Pipeline Parallelism

### Tensor Parallelism

将单个 Transformer 层的权重矩阵按列或按行切分到多张 GPU:

```
# 以 Attention 中的 W_Q 为例 (d_model=4096, n_heads=32)
# 单 GPU: W_Q 是 4096×4096 的矩阵
# 4 GPU Tensor Parallel:
#   GPU 0: W_Q[:, 0:1024]  ← 负责 head 0-7
#   GPU 1: W_Q[:, 1024:2048]← 负责 head 8-15
#   GPU 2: W_Q[:, 2048:3072]← 负责 head 16-23
#   GPU 3: W_Q[:, 3072:4096]← 负责 head 24-31
# 每张 GPU 计算后做一次 All-Reduce 合并结果
```

优点: 实现简单，减少单 GPU 显存。缺点: 每层需要 2-4 次 All-Reduce 通信，GPU 间带宽可能成为瓶颈。

### Pipeline Parallelism

将模型层按深度切分到不同 GPU:

```
# 8 层 Transformer, 4 GPU Pipeline Parallel
GPU 0: Layer 0, 1
GPU 1: Layer 2, 3
GPU 2: Layer 4, 5
GPU 3: Layer 6, 7
```

优点: 通信少（仅在层的边界传递激活值）。缺点: GPU 利用率不均（Pipeline Bubble——流水线启动和排空阶段有空闲）。

在生产系统中，TP 和 PP 常组合使用（如 GPT-3 175B: 8 way TP × 16 way PP）。

## 推理优化选型总结

| 问题 | 优化方案 | 效果 |
|---|---|---|
| 显存碎片 / 并发低 | PagedAttention + Continuous Batching | 吞吐 2-4x |
| 显存不够跑模型 | 量化 (GPTQ/AWQ/GGUF) | 显存 1/2 ~ 1/4 |
| Attention 慢/显存大 | Flash Attention | 速度 2-3x, 显存节省 |
| 单卡装不下模型 | TP + PP | 线性扩展 |
| 延迟要求严格 | 投机解码 (Speculative Decoding) | 延迟 2-3x |

## 面试追问

- **"PagedAttention 的 block 分配在 decode 阶段是预分配还是动态的？"** 动态的。每次生成 token，如果当前 block 满了就申请新 block。当请求完成，所有 block 释放回 free pool。这种动态性正是它比传统 KV Cache 高效的原因。
- **"为什么量化主要针对权重而非激活值？"** 因为权重的数值分布更容易量化（通常接近正态分布），而激活值分布因输入不同变化巨大，且存在大量异常值（outlier channels）。AWQ 正是通过分析激活值来保护异常通道。
- **"Flash Attention 和 PagedAttention 可以一起用吗？"** 可以。vLLM 同时集成了两者: Flash Attention 处理 Attention 计算的 IO 优化，PagedAttention 处理 KV Cache 的内存管理。它们是正交的优化。
- **"Continuous Batching 会导致饥饿吗？"** 会。如果一直有短请求完成并插入新请求，长请求的生成可能被推迟。vLLM 使用公平调度策略（FCFS 或优先级队列）来避免饥饿。
