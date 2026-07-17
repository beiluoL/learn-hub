---
title: 循环神经网络
category: ai
module: ai-dl
subcat: roadmap
timeline: false
level: hard
tier: key
readMinutes: 15
tags: "深度学习, rnn, sequence"
summary: 序列建模与 LSTM
order: 4
---

- RNN 处理时序
- LSTM 门控机制
- 梯度截断

```python
import torch.nn as nn
rnn = nn.LSTM(input_size=10, hidden_size=32, batch_first=True)
x = torch.randn(2, 5, 10)
out, (h, c) = rnn(x)
print(out.shape)
```

**自查清单**
- [ ] 跑 LSTM
- [ ] 理解门控
