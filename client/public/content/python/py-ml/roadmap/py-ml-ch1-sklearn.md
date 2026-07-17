---
title: scikit-learn 管线
category: python
module: py-ml
subcat: roadmap
timeline: false
level: medium
tier: core
readMinutes: 14
tags: "ML/DL 基础 (scikit-learn/TensorFlow/PyTorch)"
summary: 经典模型快速上手
order: 2
---

- train_test_split 切分
- fit/predict 接口
- Pipeline 串联预处理
- 评估指标 accuracy/f1

```python
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2)
model = LogisticRegression().fit(X_train, y_train)
print(accuracy_score(y_test, model.predict(X_test)))
```

**自查清单**
- [ ] 训练分类模型
- [ ] 计算准确率
