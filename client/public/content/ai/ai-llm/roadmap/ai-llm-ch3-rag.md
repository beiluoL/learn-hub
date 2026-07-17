---
title: 检索增强 RAG
category: ai
module: ai-llm
subcat: roadmap
timeline: false
level: hard
tier: key
readMinutes: 15
tags: "大模型 LLM, rag, vector"
summary: 向量检索与上下文拼接
order: 4
---

- 文档切分与嵌入
- 向量库检索
- 上下文拼接生成

```python
from sentence_transformers import SentenceTransformer
enc = SentenceTransformer('all-MiniLM-L6-v2')
vecs = enc.encode(['文档一', '文档二'])
print(vecs.shape)
```

**自查清单**
- [ ] 建索引
- [ ] 做检索
