---
title: 常见 NLP 任务
category: ai
module: ai-nlp
subcat: roadmap
timeline: false
level: medium
tier: core
readMinutes: 12
tags: "NLP 自然语言, tasks"
summary: NER/文本分类/问答
order: 5
---

- 命名实体识别
- 文本分类管线
- 抽取式问答

```python
from transformers import pipeline
clf = pipeline('sentiment-analysis', model='uer/roberta-base-finetuned-chinanews-chinese')
print(clf('这部电影非常精彩'))
```

**自查清单**
- [ ] 跑 NLP 管线
- [ ] 理解任务
