---
title: 模型评估
category: python
module: py-ml
subcat: roadmap
timeline: false
level: hard
tier: core
readMinutes: 14
tags: "ML/DL 基础 (scikit-learn/TensorFlow/PyTorch)"
summary: 指标与交叉验证
order: 6
---

- 混淆矩阵与 ROC
- cross_val_score 交叉验证
- precision/recall 权衡
- 学习曲线诊断

```python
from sklearn.model_selection import cross_val_score
from sklearn.ensemble import RandomForestClassifier

scores = cross_val_score(RandomForestClassifier(), X, y, cv=5)
print(scores.mean())
```

**自查清单**
- [ ] 做交叉验证
- [ ] 解读评估指标
