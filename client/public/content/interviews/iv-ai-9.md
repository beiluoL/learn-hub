---
question: Transformer 中 Self-Attention 的 Q、K、V 分别代表什么？计算流程是怎样的？
category: ai
difficulty: hard
tags: "Transformer, Attention, QKV, Self-Attention, Softmax"
order: 41
---

Self-Attention 是 Transformer 架构的灵魂。Q、K、V 可以被直观理解为"检索系统"的三要素: **Q（Query）是你想查什么，K（Key）是每个位置的标签索引，V（Value）是该位置携带的信息内容**——通过 Q 与 K 的相似度计算注意力权重，再用权重对 V 加权求和，实现"自动聚焦到相关位置"。

## 为什么需要 Self-Attention

在 Self-Attention 之前，序列模型的核心问题是**长距离依赖**:

- **RNN/LSTM**: 信息沿时间步串行传递，步数增加则梯度消失/爆炸，实际上只能处理几十步内的依赖。
- **CNN**: 通过堆叠卷积层扩大感受野，但仍是局部操作，每层的感受野有限。

Self-Attention 的突破在于: **任意两个位置直接交互**。位置 i 和位置 j 之间的路径长度恒为 O(1)，不存在距离衰减。这就是为什么 BERT 能理解"小明把苹果给小红，她很开心"中"她"指的是"小红"而非"小明"。

## Q / K / V 的物理含义

### 检索类比（最直观的理解）

想象你在一个图书馆里查找资料:

| 概念 | 检索类比 | Self-Attention 中的角色 |
|---|---|---|
| **Q（Query）** | 你要找什么书 | 当前 token 想关注什么 |
| **K（Key）** | 每本书的索引标签 | 每个 token 的特征标识 |
| **V（Value）** | 每本书的实际内容 | 每个 token 的实际语义信息 |

当你用 Q（查询意图）与所有 K（索引标签）计算匹配度，再用匹配度作为权重从对应的 V（实际内容）中提取信息——这就是 Self-Attention 的完整逻辑。

### 数学上的来源

Q、K、V 都是从同一个输入 X 通过三个不同的可学习线性变换投影而来:

```python
import torch
import torch.nn as nn
import math

class SelfAttention(nn.Module):
    def __init__(self, d_model=512, n_heads=8):
        super().__init__()
        self.d_model = d_model
        self.d_k = d_model // n_heads  # 每个头的维度

        # Q, K, V 的线性投影矩阵
        self.W_Q = nn.Linear(d_model, d_model)
        self.W_K = nn.Linear(d_model, d_model)
        self.W_V = nn.Linear(d_model, d_model)
        self.W_O = nn.Linear(d_model, d_model)  # 多头拼接后的投影

    def forward(self, x, mask=None):
        # x: (batch, seq_len, d_model)
        Q = self.W_Q(x)  # (batch, seq_len, d_model)
        K = self.W_K(x)
        V = self.W_V(x)

        # 拆成多头
        batch, seq_len, _ = Q.shape
        Q = Q.view(batch, seq_len, -1, self.d_k).transpose(1, 2)
        K = K.view(batch, seq_len, -1, self.d_k).transpose(1, 2)
        V = V.view(batch, seq_len, -1, self.d_k).transpose(1, 2)
        # 形状: (batch, n_heads, seq_len, d_k)

        # Scaled Dot-Product Attention
        scores = torch.matmul(Q, K.transpose(-2, -1)) / math.sqrt(self.d_k)
        # scores: (batch, n_heads, seq_len, seq_len)

        if mask is not None:
            scores = scores.masked_fill(mask == 0, -1e9)

        attn_weights = torch.softmax(scores, dim=-1)
        # attn_weights: (batch, n_heads, seq_len, seq_len)

        output = torch.matmul(attn_weights, V)
        # output: (batch, n_heads, seq_len, d_k)

        # 拼接多头
        output = output.transpose(1, 2).contiguous().view(batch, seq_len, -1)
        return self.W_O(output)
# 注意: 这只是单层 Self-Attention，完整 Transformer 还需 FFN、LayerNorm 等
```

### 三个矩阵为什么要有区别

一个重要问题: "既然都来自 X，为什么要用三个不同的投影矩阵，而不直接 Q=K=V=X？"

答案: **三个不同的投影矩阵让模型学习到同一输入的不同表示**。Q 学会"怎么问"，K 学会"怎么标"，V 学会"怎么答"。如果不做投影，attention 矩阵会退化成对称的，表达能力大幅下降。

## Scaled Dot-Product Attention 公式解析

```
Attention(Q, K, V) = softmax(Q * K^T / sqrt(d_k)) * V
```

逐成分拆解:

### 1. Q * K^T：计算相似度矩阵

矩阵乘法 Q × K^T 的结果是一个 (seq_len × seq_len) 的矩阵 `S`，其中 `S[i][j]` = 第 i 个 token 的 Q 与第 j 个 token 的 K 的点积。

点积越大 → 方向越接近 → 语义越相关。等价于余弦相似度 × 向量模长。

### 2. 除以 sqrt(d_k)：为什么是缩放因子 sqrt(d_k)？

**核心原因: 防止 Softmax 进入饱和区。**

当 d_k 较大时（如 64），Q 和 K 向量各维度的方差叠加导致点积值的方差膨胀到 d_k 倍。未经缩放的点积值可能达到 ±100+，此时 Softmax 梯度几乎为 0:

```python
# 缩放的直观演示
import torch, math
d_k = 64
Q = torch.randn(1, d_k)  # 均值为 0，方差为 1
K = torch.randn(1, d_k)
dot = (Q * K).sum()
# dot 的期望为 0，方差约为 d_k = 64 → 标准差 ≈ 8
# 极端值可达 ±24+

unscaled = torch.softmax(torch.tensor([100.0, -5.0, 3.0]), dim=-1)
# tensor([1.0, ~0.0, ~0.0]) → 梯度几乎为 0

scaled = torch.softmax(torch.tensor([100.0 / 8, -5.0 / 8, 3.0 / 8]), dim=-1)
# tensor([0.9999, 2.0e-6, 5.4e-4]) → 有一定分布，梯度更大
```

**为什么是 sqrt(d_k) 而不是 d_k 或其他**: 经过数学推导，Q、K 各维度独立且均值为 0、方差为 1 时，点积的方差恰好为 d_k。除以 sqrt(d_k) 使方差归一化到 1，这正是 Softmax 梯度最健康的区域。

### 3. Softmax：归一化为注意力权重

将相似度转化为概率分布: `w_i = exp(S_i) / Σ exp(S_j)`。结果是一个概率向量，和为 1。

### 4. 乘以 V：加权聚合信息

用注意力权重对 V 加权求和: `output = Σ w_i * V_i`。

这就是 Attention 的精妙之处: **每个 token 的输出不是它自己的 V，而是所有 token 的 V 的加权和**——权重由它与所有 token 的匹配度决定。

## Multi-Head Attention：并行捕捉多种关系

单头 Attention 只能学习一种关系模式。Multi-Head Attention 将 Q/K/V 沿 d_model 维度切分，每个头独立计算:

```python
# Multi-Head 的拆分示意
# d_model = 512, n_heads = 8 → d_k = 64

# Head 0: Q_0 = X @ W_Q[:, :64], K_0 = X @ W_K[:, :64], V_0 = X @ W_V[:, :64]
# Head 1: Q_1 = X @ W_Q[:, 64:128], ...
# ...
# Head 7: Q_7 = X @ W_Q[:, 448:512], ...

# 每个头独立做 Attention，最后拼接:
# MultiHead(Q,K,V) = Concat(head_0, ..., head_7) @ W_O
```

**为什么 Multi-Head 优于增大 d_k**: 多个小头的并行使模型能同时关注不同类型的依赖。例如在翻译"我昨天在书店买的那本书非常有趣"时，一个头可能关注主语-谓语关系（书-有趣），另一个头关注时间修饰（昨天-买），第三个头关注地点修饰（书店-买）。

## Causal Mask：Decoder 中的因果遮罩

在 Decoder（如 GPT）中，生成第 i 个 token 时不能看到未来的 token（i+1, i+2, ...）。实现方式是在 Softmax 前给未来的位置加上 -inf:

```
[ QK^T/sqrt(d_k) ]  →  加上 mask  →  Softmax
[x x x x]              [x -∞ -∞ -∞]  [1  0  0  0]
[x x x x]              [x  x -∞ -∞]  [a  b  0  0]
[x x x x]     →       [x  x  x -∞] → [a  b  c  0]
[x x x x]              [x  x  x  x]  [a  b  c  d]
```

## 位置编码：融入顺序信息

Self-Attention 本身是**排列等价的**——如果打乱输入序列的顺序，输出也只是做相应排列。这导致模型无法区分"我爱你"和"你爱我"。

解决方案: 在输入 Embedding 上叠加位置编码:

```python
# 正弦位置编码
def sinusoidal_position_encoding(seq_len, d_model):
    pe = torch.zeros(seq_len, d_model)
    position = torch.arange(seq_len).unsqueeze(1)
    div_term = torch.exp(
        torch.arange(0, d_model, 2) * (-math.log(10000.0) / d_model)
    )
    pe[:, 0::2] = torch.sin(position * div_term)  # 偶数维用 sin
    pe[:, 1::2] = torch.cos(position * div_term)  # 奇数维用 cos
    return pe
```

**为何选 sin/cos**: 正弦余弦函数满足 `PE(pos+k)` 可以被 `PE(pos)` 线性表示，这理论上让模型更容易学习相对位置关系。实际中，可学习的绝对位置编码（learned position embedding）在很多任务中表现更好（GPT 用的就是这种）。

## 输入输出形状变化全流程

```
Input tokens:      "我  爱  学  习"  (seq_len=4)
Token Embedding:   (4, 512)
Position Encoding: (4, 512) 相加
Input to Attention: (4, 512)

Linear(Q):  (1, 8, 4, 64)    # (batch, n_heads, seq_len, d_k)
Linear(K):  (1, 8, 4, 64)
Linear(V):  (1, 8, 4, 64)

Scores = Q @ K^T:  (1, 8, 4, 4)     # 每个头的注意力矩阵
Scaled + Mask:     (1, 8, 4, 4)
Softmax:           (1, 8, 4, 4)
Weighted V:        (1, 8, 4, 64)
Concat heads:      (1, 4, 512)
Linear(O):         (1, 4, 512)

→ Feed Forward Network → LayerNorm → 下一层
```

## 面试追问

- **"Self-Attention 的时间复杂度是多少？"** O(n² * d)，其中 n 是序列长度，d 是模型维度。n² 来自注意力矩阵的计算和存储。这也是长序列推理的瓶颈——序列翻倍，计算量翻四倍。
- **"Encoder 和 Decoder 的 Self-Attention 有什么区别？"** Encoder 是双向的（能看到全部 token），Decoder 是单向的（Causal Mask）。在 Encoder-Decoder Attention（Cross-Attention）中，Q 来自 Decoder，K 和 V 来自 Encoder 输出。
- **"为什么 Transformer 中要交替使用 Attention 和 FFN？"** Attention 负责 token 间的信息交换（横向通信），FFN 负责每个 token 内部的非线性变换（纵向思考）。两者缺一不可——只有 Attention 则表达能力受限，只有 FFN 则无法利用上下文。
- **"不用 Softmax 换成其他激活函数可以吗？"** 理论上可以，Softmax 的优势是输出天然是概率分布（正值且和为 1），适合作为"分配注意力"的机制。有研究尝试用 ReLU 或其他稀疏激活函数（如 ReLU Attention），在长序列上有速度和稀疏性优势，但精度通常略低于 Softmax。
