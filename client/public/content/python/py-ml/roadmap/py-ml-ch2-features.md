---
title: 特征工程
category: python
module: py-ml
subcat: roadmap
timeline: false
level: medium
tier: key
readMinutes: 13
tags: "ML/DL 基础 (scikit-learn/TensorFlow/PyTorch)"
summary: 编码与标准化
order: 3
---

- OneHotEncoder 类别编码
- StandardScaler 标准化
- 缺失值填充
- 特征选择降维

```python
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import make_pipeline
from sklearn.linear_model import Ridge

pipe = make_pipeline(StandardScaler(), Ridge())
pipe.fit(X_train, y_train)
```

**自查清单**
- [ ] 标准化特征
- [ ] 用 Pipeline 串联
