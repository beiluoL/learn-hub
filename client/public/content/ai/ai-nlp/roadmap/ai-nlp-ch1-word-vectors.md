---
title: 词向量
category: ai
module: ai-nlp
subcat: roadmap
timeline: false
level: medium
tier: core
readMinutes: 13
tags: "NLP 自然语言, embedding"
summary: Word2Vec 与词嵌入
order: 2
---

- CBOW 与 Skip-gram
- 余弦相似度
- 嵌入可视化

```python
from gensim.models import Word2Vec
sentences = [['苹果', '手机'], ['香蕉', '水果']]
model = Word2Vec(sentences, vector_size=50, window=2, min_count=1)
print(model.wv['苹果'])
```

**自查清单**
- [ ] 训练词向量
- [ ] 算相似度
