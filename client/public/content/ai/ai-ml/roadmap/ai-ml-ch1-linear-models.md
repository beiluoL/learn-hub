---
title: 线性模型
category: ai
module: ai-ml
subcat: roadmap
timeline: false
level: easy
tier: core
readMinutes: 12
tags: "机器学习, linear, classification"
summary: 线性回归与逻辑回归
order: 2
---

- 逻辑回归做分类
- 正则化 L1/L2
- 特征缩放重要性

```python
from sklearn.linear_model import LogisticRegression
clf = LogisticRegression(max_iter=1000)
clf.fit(X_train, y_train)
print(clf.score(X_test, y_test))
```

**自查清单**
- [ ] 训练逻辑回归
- [ ] 理解正则
