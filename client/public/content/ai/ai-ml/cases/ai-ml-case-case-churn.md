---
title: 案例：客户流失预测
category: ai
module: ai-ml
subcat: cases
timeline: false
level: medium
tier: key
readMinutes: 22
tags: "机器学习, 项目案例"
summary: 端到端二分类建模流程
order: 1
---

- EDA 与特征构造
- 训练对比多个模型
- 用 AUC 选优

```python
from sklearn.ensemble import GradientBoostingClassifier
from sklearn.metrics import roc_auc_score
model = GradientBoostingClassifier().fit(X_train, y_train)
pred = model.predict_proba(X_test)[:, 1]
print(roc_auc_score(y_test, pred))
```

**自查清单**
- [ ] 完成建模
- [ ] 输出 AUC
