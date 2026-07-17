---
title: 模型评估
category: ai
module: ai-ml
subcat: roadmap
timeline: false
level: medium
tier: key
readMinutes: 12
tags: "机器学习, evaluation"
summary: 指标、交叉验证与偏差方差
order: 6
---

- 精确率/召回率/F1
- ROC 与 AUC
- 交叉验证防过拟合

```python
from sklearn.model_selection import cross_val_score
scores = cross_val_score(clf, X, y, cv=5, scoring='f1')
print(scores.mean())
```

**自查清单**
- [ ] 算多指标
- [ ] 做交叉验证
