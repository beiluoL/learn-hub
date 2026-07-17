---
title: 案例：企业知识库问答
category: ai
module: ai-llm
subcat: cases
timeline: false
level: hard
tier: key
readMinutes: 26
tags: "大模型 LLM, 项目案例"
summary: RAG 搭建内部文档问答
order: 1
---

- 文档入库向量化
- 检索+生成
- 评估回答质量

```python
def answer(query, index, top_k=3):
    q = encoder.encode(query)
    hits = index.search(q, top_k)
    context = '\n'.join(hits)
    return llm(prompt=f'根据:{context}\n回答:{query}')
```

**自查清单**
- [ ] 完成 RAG
- [ ] 验证回答
