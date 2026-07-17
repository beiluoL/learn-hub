---
title: 决策树与集成
category: ai
module: ai-ml
subcat: roadmap
timeline: false
level: medium
tier: core
readMinutes: 14
tags: "机器学习, tree, ensemble"
summary: 树模型、随机森林与梯度提升
order: 3
---

- 信息增益与基尼系数
- Bagging 与 Boosting
- XGBoost/LightGBM 简介

```python
from sklearn.ensemble import RandomForestClassifier
rf = RandomForestClassifier(n_estimators=100, random_state=0)
rf.fit(X_train, y_train)
print(rf.feature_importances_)
```

**自查清单**
- [ ] 训练森林
- [ ] 查看特征重要性
