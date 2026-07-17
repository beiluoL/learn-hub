---
title: 案例：中文情感分析
category: ai
module: ai-nlp
subcat: cases
timeline: false
level: medium
tier: key
readMinutes: 22
tags: "NLP 自然语言, 项目案例"
summary: 微调 BERT 做情感分类
order: 1
---

- 准备标注数据
- 微调分类头
- 评估 F1

```python
from transformers import AutoModelForSequenceClassification
model = AutoModelForSequenceClassification.from_pretrained(
    'bert-base-chinese', num_labels=2)
print(model.config.num_labels)
```

**自查清单**
- [ ] 微调模型
- [ ] 报告 F1
