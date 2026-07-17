---
title: 向量数据库
category: ai
module: ai-deploy
subcat: roadmap
timeline: false
level: medium
tier: core
readMinutes: 13
tags: "推理部署, vector, faiss"
summary: 近似最近邻检索
order: 4
---

- Faiss/Milvus 选型
- HNSW 索引
- 相似度度量

```python
import faiss
index = faiss.IndexFlatL2(768)
index.add(vectors)
D, I = index.search(query, k=5)
```

**自查清单**
- [ ] 建索引
- [ ] 做检索
