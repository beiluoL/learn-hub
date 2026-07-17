---
title: 大模型基础
category: ai
module: ai-llm
subcat: roadmap
timeline: false
level: medium
tier: basic
readMinutes: 11
tags: "大模型 LLM, llm, basics"
summary: 规模定律与自回归生成
order: 1
---

- Scaling Law
- 自回归生成
- Tokenizer 作用

```python
from transformers import AutoTokenizer
tok = AutoTokenizer.from_pretrained('gpt2')
ids = tok('Hello world', return_tensors='pt').input_ids
print(ids.shape)
```

**自查清单**
- [ ] 理解生成
- [ ] 会分词
