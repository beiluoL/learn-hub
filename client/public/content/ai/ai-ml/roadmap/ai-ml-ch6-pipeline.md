---
title: 流水线 Pipeline
category: ai
module: ai-ml
subcat: roadmap
timeline: false
level: medium
tier: extra
readMinutes: 11
tags: "机器学习, pipeline"
summary: 组合预处理与模型
order: 7
---

- Pipeline 串接步骤
- 网格搜索调参
- 避免数据泄漏

```python
from sklearn.pipeline import Pipeline
pipe = Pipeline([('sc', StandardScaler()), ('clf', LogisticRegression())])
pipe.fit(X_train, y_train)
```

**自查清单**
- [ ] 搭 Pipeline
- [ ] 理解泄漏
