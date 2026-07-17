---
title: PyTorch 实战
category: ai
module: ai-dl
subcat: roadmap
timeline: false
level: medium
tier: core
readMinutes: 14
tags: "深度学习, pytorch"
summary: Dataset/DataLoader 与训练循环
order: 7
---

- Dataset 封装
- DataLoader 批处理
- 训练/验证循环

```python
from torch.utils.data import DataLoader, TensorDataset
ds = TensorDataset(torch.randn(100, 4), torch.randint(0, 2, (100,)))
dl = DataLoader(ds, batch_size=16, shuffle=True)
for xb, yb in dl:
    print(xb.shape, yb.shape)
    break
```

**自查清单**
- [ ] 写训练循环
- [ ] 用 DataLoader
