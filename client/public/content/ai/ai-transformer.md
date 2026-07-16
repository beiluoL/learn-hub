---
title: Transformer 架构与 Attention 机制
category: ai
level: intermediate
readMinutes: 22
tags: "Transformer, Attention, LLM, 架构"
summary: Transformer 架构与 Attention 机制深度解析。
order: 22
prereq:
---

## 从 RNN 到 Transformer 的演进

在 Transformer 出现之前，序列建模主要由 RNN 和 LSTM 主导。这类模型按时间步逐步处理输入，存在三个根本性缺陷：

1. **串行计算**：每个时间步必须等待前一步完成，无法并行化
2. **长距离依赖**：梯度在长序列中衰减（即便 LSTM 也有限）
3. **训练速度慢**：序列越长训练越慢

2017 年，Google 在论文《Attention Is All You Need》中提出 Transformer，完全摒弃循环结构，仅依赖 Attention 机制建模序列关系。这一架构成为 NLP 领域的革命性突破，并催生了 BERT、GPT 等里程碑模型。

## Self-Attention 机制

Self-Attention 的核心思想：让序列中每个位置都关注序列中的所有位置，计算加权表示。

对于每个输入 token，生成三个向量：

- **Query (Q)**：该位置"想要查找什么"
- **Key (K)**：该位置"拥有什么标签"
- **Value (V)**：该位置"包含什么信息"

计算流程（伪代码）：

```python
import torch
import torch.nn.functional as F

def self_attention(Q, K, V, mask=None):
    """
    Q: (batch, heads, seq_len, d_k)
    K: (batch, heads, seq_len, d_k)
    V: (batch, heads, seq_len, d_v)
    """
    d_k = Q.size(-1)

    # 步骤 1: 计算注意力分数 Q·K^T
    scores = torch.matmul(Q, K.transpose(-2, -1)) / torch.sqrt(torch.tensor(d_k))

    # 步骤 2: 可选掩码（Decoder 中的因果掩码或 Padding 掩码）
    if mask is not None:
        scores = scores.masked_fill(mask == 0, float('-inf'))

    # 步骤 3: Softmax 归一化得到注意力权重
    attention_weights = F.softmax(scores, dim=-1)

    # 步骤 4: 加权求和 V
    output = torch.matmul(attention_weights, V)

    return output, attention_weights
```

**关键注意**：除以 `sqrt(d_k)` 是为了防止点积结果过大导致 Softmax 梯度消失。当 d_k 增大时，点积方差增大，不缩放会导致 Softmax 输出极端化。

### 注意力矩阵可视化

注意力权重矩阵是一个 (seq_len × seq_len) 的方阵。行 i 表示第 i 个 token 对所有 token 的关注分布。对角线附近关注局部上下文，特定位置关注语义相关词（如同义词、指代关系）。

## Multi-Head Attention

单头 Attention 只能捕获一种关系模式。Multi-Head Attention 并行运行多个独立的 Attention，每个头关注不同的子空间，最后拼接结果并线性投影。

```python
class MultiHeadAttention(nn.Module):
    def __init__(self, d_model=512, num_heads=8):
        super().__init__()
        assert d_model % num_heads == 0
        self.d_k = d_model // num_heads
        self.num_heads = num_heads

        self.W_q = nn.Linear(d_model, d_model)
        self.W_k = nn.Linear(d_model, d_model)
        self.W_v = nn.Linear(d_model, d_model)
        self.W_o = nn.Linear(d_model, d_model)

    def forward(self, x, mask=None):
        batch_size, seq_len, d_model = x.shape

        # 投影到 Q/K/V 并拆分为多头
        Q = self.W_q(x).view(batch_size, seq_len, self.num_heads, self.d_k).transpose(1, 2)
        K = self.W_k(x).view(batch_size, seq_len, self.num_heads, self.d_k).transpose(1, 2)
        V = self.W_v(x).view(batch_size, seq_len, self.num_heads, self.d_k).transpose(1, 2)

        # 计算自注意力
        attn_output, _ = self_attention(Q, K, V, mask)

        # 合并多头
        attn_output = attn_output.transpose(1, 2).contiguous().view(
            batch_size, seq_len, d_model
        )

        return self.W_o(attn_output)
```

不同头往往学会关注不同类型的语言特征：有的关注相邻词，有的关注主谓关系，有的关注长距离指代。

## 位置编码

Transformer 缺乏天然的时序感知能力，需要显式注入位置信息。

### Sinusoidal 位置编码

原始论文使用的正弦/余弦编码：

```python
def sinusoidal_positional_encoding(max_len, d_model):
    pe = torch.zeros(max_len, d_model)
    position = torch.arange(0, max_len).unsqueeze(1).float()
    div_term = torch.exp(
        torch.arange(0, d_model, 2).float() * (-torch.log(torch.tensor(10000.0)) / d_model)
    )
    pe[:, 0::2] = torch.sin(position * div_term)
    pe[:, 1::2] = torch.cos(position * div_term)
    return pe.unsqueeze(0)  # (1, max_len, d_model)
```

它的优势在于可以外推到训练时没见过的更长序列。

### 可学习位置编码

GPT 系列使用可学习的 Embedding 作为位置编码，与 token embedding 相加。RoPE（旋转位置编码）是近年流行的替代方案，在 LLaMA 等模型中使用，具有更好的长度外推能力。

## FFN + LayerNorm + 残差连接

每个 Transformer Block 的标准结构：

```
输入 x
├─→ Multi-Head Attention ─→ Add & Norm ─┐
│    (残差连接 + LayerNorm)              │
├─→ Feed-Forward Network ─→ Add & Norm ┘
     输出
```

### Feed-Forward Network

简单的两层全连接网络，中间使用激活函数：

```python
class FeedForward(nn.Module):
    def __init__(self, d_model=512, d_ff=2048, dropout=0.1):
        super().__init__()
        self.linear1 = nn.Linear(d_model, d_ff)
        self.linear2 = nn.Linear(d_ff, d_model)
        self.dropout = nn.Dropout(dropout)
        self.activation = nn.GELU()  # 现代 Transformer 多用 GELU

    def forward(self, x):
        return self.linear2(self.dropout(self.activation(self.linear1(x))))
```

**为什么 d_ff 通常设为 d_model 的 4 倍**：FFN 是 Transformer 参数的主要来源（约占 2/3），增加中间层维度增强表达能力。

### LayerNorm

与 BatchNorm 不同，LayerNorm 沿特征维度归一化，不依赖 batch 统计量，因此训练和推理行为一致。在原始 Transformer 中 LayerNorm 放在残差连接之后（Post-LN），现代模型如 GPT 系列偏好 Pre-LN（LayerNorm 放在子层之前），训练更稳定。

## 三类 Transformer 架构

| 架构类型 | 代表模型 | 自注意力范围 | 适用任务 |
|---------|---------|------------|---------|
| Encoder-only | BERT, RoBERTa | 双向（全局） | 文本理解、分类、NER |
| Decoder-only | GPT, LLaMA | 单向（因果掩码） | 文本生成、对话 |
| Encoder-Decoder | T5, BART | Encoder 双向 + Decoder 单向 | 翻译、摘要、问答 |

### 为什么 Decoder-only 能并行训练？

Decoder 使用因果掩码，确保位置 i 只能看到位置 1 到 i。通过矩阵运算一次性计算所有位置的注意力，无需串行展开时间步。但在推理（自回归生成）时仍需逐 token 输出。

## 计算复杂度分析

标准的 Self-Attention 复杂度为 O(n²·d)，其中 n 为序列长度，d 为特征维度。长序列（> 2048 token）计算资源增长显著。优化方向包括：Flash Attention（IO 感知的精确注意力）、Sparse Attention、线性 Attention 近似。

## 实际开发中的应用 / 常见问题

### 如何选择 Encoder 还是 Decoder 架构？

- **文本理解**（分类、情感分析、信息抽取）：选 Encoder-only（BERT）
- **文本生成**（写文章、对话、代码生成）：选 Decoder-only（GPT/LLaMA）
- **输入输出都是序列**（翻译、摘要）：选 Encoder-Decoder（T5）

### 位置编码怎么选？

- 训练和推理长度固定：可学习位置编码
- 需要外推到更长序列：RoPE 或 ALiBi
- 兼容原始论文实现：Sinusoidal

### 注意力矩阵如何加速和节省显存？

Flash Attention 是当前主流方案，通过分块计算和 IO 优化，将 O(n²) 的内存访问降低为 O(n)，使长序列训练成为可能。几乎所有现代 LLM 框架（vLLM、Text Generation Inference）都默认使用。

### 什么是 KV Cache？

推理时，Decoder 每生成一个 token 都会重新计算历史 token 的 K 和 V 矩阵。KV Cache 缓存已计算过的 K、V，每次只计算新 token 的 Q、K、V，将推理复杂度从 O(n²·d) 降到 O(n·d)（每个新 token）。
