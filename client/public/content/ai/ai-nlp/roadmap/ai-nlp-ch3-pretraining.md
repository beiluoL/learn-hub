---
title: 预训练模型
category: ai
module: ai-nlp
subcat: roadmap
timeline: false
level: hard
tier: key
readMinutes: 16
tags: "NLP 自然语言, pretrain, bert"
summary: BERT/GPT 与迁移学习
order: 4
---

- 掩码语言模型
- 预训练加微调
- 下游任务适配

```python
from transformers import AutoTokenizer, AutoModel
tok = AutoTokenizer.from_pretrained('bert-base-chinese')
model = AutoModel.from_pretrained('bert-base-chinese')
inputs = tok('你好世界', return_tensors='pt')
print(model(**inputs).last_hidden_state.shape)
```

**自查清单**
- [ ] 加载预训练
- [ ] 取句向量
