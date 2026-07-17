---
title: NLP 工程化
category: ai
module: ai-nlp
subcat: roadmap
timeline: false
level: medium
tier: extra
readMinutes: 12
tags: "NLP 自然语言, serving"
summary: 批处理与推理优化
order: 7
---

- 批量编码
- 缓存嵌入
- 服务化部署

```python
texts = ['句子一', '句子二']
inputs = tok(texts, padding=True, truncation=True, return_tensors='pt')
print(inputs['input_ids'].shape)
```

**自查清单**
- [ ] 批量推理
- [ ] 加缓存
