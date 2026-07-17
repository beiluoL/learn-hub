---
title: 序列模型做文本
category: ai
module: ai-nlp
subcat: roadmap
timeline: false
level: medium
tier: core
readMinutes: 13
tags: "NLP 自然语言, text, rnn"
summary: 用 RNN/TextCNN 做分类
order: 3
---

- 文本转序列
- 填充与掩码
- 情感分类

```python
from torch.nn.utils.rnn import pad_sequence
seqs = [torch.tensor([1, 2, 3]), torch.tensor([4, 5])]
padded = pad_sequence(seqs, batch_first=True)
print(padded)
```

**自查清单**
- [ ] 做文本分类
- [ ] 理解填充
