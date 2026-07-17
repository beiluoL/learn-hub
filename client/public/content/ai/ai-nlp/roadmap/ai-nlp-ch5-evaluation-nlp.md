---
title: NLP 评估指标
category: ai
module: ai-nlp
subcat: roadmap
timeline: false
level: medium
tier: extra
readMinutes: 11
tags: "NLP 自然语言, evaluation"
summary: BLEU/ROUGE/准确率
order: 6
---

- 生成任务指标
- 分类指标
- 人工评估重要性

```python
from nltk.translate.bleu_score import sentence_bleu
ref = [['the', 'cat', 'sat']]
hyp = ['the', 'cat', 'sat']
print(sentence_bleu(ref, hyp))
```

**自查清单**
- [ ] 算 BLEU
- [ ] 选合适指标
