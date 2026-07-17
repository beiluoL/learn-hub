---
title: 鸢尾花分类
category: python
module: py-ml
subcat: cases
timeline: false
level: medium
tier: core
readMinutes: 24
tags: "ML/DL 基础 (scikit-learn/TensorFlow/PyTorch), 项目案例"
summary: 端到端训练分类器
order: 1
---

- 加载 iris 数据集
- 划分训练测试集
- 训练随机森林
- 输出评估指标

```python
from sklearn.datasets import load_iris
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split

X, y = load_iris(return_X_y=True)
Xtr, Xte, ytr, yte = train_test_split(X, y, test_size=0.2)
clf = RandomForestClassifier().fit(Xtr, ytr)
print(clf.score(Xte, yte))
```

**自查清单**
- [ ] 训练并评估
- [ ] 准确率合理
