---
title: 深度学习基础
category: ai
level: intermediate
readMinutes: 20
tags: "深度学习, 神经网络, 反向传播, 激活函数"
summary: 深度学习基础：神经网络架构、反向传播与激活函数。
order: 21
prereq: ai/ai-ml-basics
---

## 从感知机到多层感知机

感知机是最简单的神经网络单元，对输入进行加权求和后通过阶跃函数输出结果。然而单层感知机只能解决线性可分问题（如 AND/OR），无法处理 XOR 这类非线性问题。

多层感知机通过在输入层和输出层之间添加隐藏层，并引入非线性激活函数，克服了这一限制。三层及以上的网络被称为深度神经网络。

```python
import torch
import torch.nn as nn

# 一个简单的多层感知机
class SimpleMLP(nn.Module):
    def __init__(self, input_dim, hidden_dim, output_dim):
        super().__init__()
        self.layer1 = nn.Linear(input_dim, hidden_dim)
        self.layer2 = nn.Linear(hidden_dim, hidden_dim)
        self.layer3 = nn.Linear(hidden_dim, output_dim)
        self.relu = nn.ReLU()
        self.dropout = nn.Dropout(0.2)

    def forward(self, x):
        x = self.relu(self.layer1(x))
        x = self.dropout(x)
        x = self.relu(self.layer2(x))
        x = self.dropout(x)
        x = self.layer3(x)
        return x

model = SimpleMLP(input_dim=784, hidden_dim=256, output_dim=10)
print(f"模型参数总数: {sum(p.numel() for p in model.parameters()):,}")
```

## 前向传播与反向传播

### 前向传播

前向传播将输入数据逐层计算，最终输出预测结果。每一层的计算为：`z = Wx + b`，然后通过激活函数 `a = f(z)`。

```python
import torch.optim as optim
from torch.utils.data import DataLoader, TensorDataset

# 假设有数据
X_train_tensor = torch.randn(1000, 784)
y_train_tensor = torch.randint(0, 10, (1000,))

dataset = TensorDataset(X_train_tensor, y_train_tensor)
dataloader = DataLoader(dataset, batch_size=32, shuffle=True)

criterion = nn.CrossEntropyLoss()
optimizer = optim.Adam(model.parameters(), lr=0.001)

# 训练循环示意
for epoch in range(5):
    for batch_X, batch_y in dataloader:
        # 前向传播
        outputs = model(batch_X)
        loss = criterion(outputs, batch_y)

        # 反向传播
        optimizer.zero_grad()
        loss.backward()
        optimizer.step()

    print(f"Epoch {epoch+1}, Loss: {loss.item():.4f}")
```

### 反向传播

反向传播是深度学习的核心算法，通过链式法则计算损失函数关于每个参数的梯度，然后使用梯度下降更新参数。

计算图视角下的反向传播：前向计算时记录每个操作的输入输出；反向传播时从损失开始，沿计算图反向传播梯度，逐层计算 `dL/dW` 和 `dL/db`。

**关键注意**：PyTorch 的 `autograd` 自动处理反向传播，但理解其原理对于调试（如梯度消失/爆炸）至关重要。

## 激活函数

激活函数引入非线性，使神经网络能够学习复杂映射。

| 函数 | 公式 | 优点 | 缺点 |
|------|------|------|------|
| ReLU | max(0, x) | 计算简单，缓解梯度消失 | 神经元死亡（负半轴梯度为 0） |
| Sigmoid | 1/(1+e^(-x)) | 输出 [0,1]，可作概率 | 梯度消失，输出非零均值 |
| Tanh | (e^x-e^(-x))/(e^x+e^(-x)) | 零均值输出 | 仍存在梯度消失 |
| LeakyReLU | max(0.01x, x) | 解决神经元死亡问题 | 负半轴斜率需调试 |
| Softmax | e^xi/Σe^xj | 多分类概率归一化 | 仅用于输出层 |

```python
# 不同激活函数的 PyTorch 实现
activations = {
    'relu': nn.ReLU(),
    'leaky_relu': nn.LeakyReLU(0.01),
    'sigmoid': nn.Sigmoid(),
    'tanh': nn.Tanh(),
    'gelu': nn.GELU(),  # Transformer 常用
    'softmax': nn.Softmax(dim=-1),
}

# GELU 是 BERT/GPT 等 Transformer 模型的默认激活函数
```

## 损失函数

损失函数衡量模型预测与真实值之间的差距，引导优化方向。

```python
# 常用损失函数
loss_functions = {
    'mse': nn.MSELoss(),           # 回归任务
    'cross_entropy': nn.CrossEntropyLoss(),  # 多分类
    'bce': nn.BCEWithLogitsLoss(),  # 二分类（数值稳定的版本）
}

# 自定义损失函数示例
class FocalLoss(nn.Module):
    """处理类别不平衡的焦点损失"""
    def __init__(self, alpha=0.25, gamma=2.0):
        super().__init__()
        self.alpha = alpha
        self.gamma = gamma

    def forward(self, inputs, targets):
        ce_loss = nn.functional.cross_entropy(inputs, targets, reduction='none')
        pt = torch.exp(-ce_loss)
        focal_loss = self.alpha * (1 - pt) ** self.gamma * ce_loss
        return focal_loss.mean()
```

## 优化器与学习率

### SGD 与动量

随机梯度下降是最基础的优化器。加入动量（Momentum）后，更新方向不仅考虑当前梯度，还保留历史梯度方向，有助于加速收敛和逃离局部最优。

### Adam

Adam 结合了动量（一阶矩估计）和自适应学习率（二阶矩估计），是目前使用最广泛的优化器。其默认参数（lr=0.001, betas=(0.9, 0.999)）在大多数任务中表现良好。

### Mini-Batch 训练

将数据分成小批量（batch）处理，平衡了单样本 SGD 的震荡和全量 GD 的计算成本。典型 batch size 为 32/64/128，受 GPU 显存限制。

### 学习率调度

固定的学习率往往不够理想。常用的调度策略：

```python
from torch.optim.lr_scheduler import (
    StepLR, CosineAnnealingLR, ReduceLROnPlateau,
    OneCycleLR
)

# 余弦退火（现代训练标准）
scheduler = CosineAnnealingLR(optimizer, T_max=100, eta_min=1e-6)

# 验证集指标不再提升时降低学习率
scheduler = ReduceLROnPlateau(
    optimizer, mode='min', patience=5, factor=0.5
)

# OneCycle 学习率策略（训练速度快）
scheduler = OneCycleLR(
    optimizer, max_lr=0.01,
    steps_per_epoch=len(dataloader), epochs=10
)
```

## 实际开发中的应用 / 常见问题

### 梯度消失与梯度爆炸

**梯度消失**：深层网络中梯度在反向传播过程中逐渐趋近于零，导致浅层参数无法更新。解决：使用 ReLU 激活、批归一化、残差连接。

**梯度爆炸**：梯度指数级增长导致参数更新过大。解决：梯度裁剪（`torch.nn.utils.clip_grad_norm_`）。

### 如何选择 Batch Size？

- 小 batch（16-32）：泛化能力好，但训练波动大
- 大 batch（256-512）：训练稳定，但可能陷入尖锐的局部最优
- **经验建议**：从 32 或 64 开始，在 GPU 显存允许范围内调大

### 过拟合怎么办？

除了常规正则化手段，深度学习特有方法包括：Dropout（训练时随机丢弃神经元）、Batch Normalization（同时有轻微正则化效果）、数据增强（图像翻转/旋转、文本回译）、权重衰减。

### 何时使用预训练模型？

除非拥有海量标注数据和充足算力，否则优选预训练模型微调（Fine-tuning）。即使目标任务数据量少，微调通常也优于从头训练。
