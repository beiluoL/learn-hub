---
title: 特征工程
category: ai
module: ai-ml
subcat: roadmap
timeline: false
level: medium
tier: key
readMinutes: 13
tags: "机器学习, feature"
summary: 编码、缩放与特征选择
order: 5
---

- 类别变量编码
- 标准化/归一化
- 缺失值插补

```python
from sklearn.preprocessing import StandardScaler, OneHotEncoder
sc = StandardScaler().fit_transform(X_num)
enc = OneHotEncoder().fit_transform(X_cat)
```

**自查清单**
- [ ] 完成编码与缩放
- [ ] 处理缺失
