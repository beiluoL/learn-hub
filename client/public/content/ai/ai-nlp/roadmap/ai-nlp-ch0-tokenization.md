---
title: 分词与预处理
category: ai
module: ai-nlp
subcat: roadmap
timeline: false
level: easy
tier: basic
readMinutes: 10
tags: "NLP 自然语言, nlp, tokenize"
summary: 中文分词与子词切分
order: 1
---

- jieba 中文分词
- BPE/WordPiece 子词
- 去除停用词

```python
import jieba
text = '深度学习推动自然语言处理发展'
print(list(jieba.cut(text)))
```

**自查清单**
- [ ] 跑分词
- [ ] 理解子词
