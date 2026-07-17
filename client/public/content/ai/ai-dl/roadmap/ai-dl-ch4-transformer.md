---
title: Transformer 架构
category: ai
module: ai-dl
subcat: roadmap
timeline: false
level: hard
tier: key
readMinutes: 17
tags: "深度学习, transformer, attention"
summary: 自注意力与位置编码
order: 5
---

- 自注意力机制
- 多头注意力
- 残差与层归一化

```python
import torch.nn as nn
attn = nn.MultiheadAttention(embed_dim=64, num_heads=8, batch_first=True)
x = torch.randn(2, 10, 64)
out, _ = attn(x, x, x)
print(out.shape)
```

**自查清单**
- [ ] 用多头注意力
- [ ] 理解 QKV
