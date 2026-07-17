---
title: 机器学习概览
category: ai
module: ai-ml
subcat: roadmap
timeline: false
level: easy
tier: basic
readMinutes: 10
tags: "机器学习, ml, overview"
summary: 监督/无监督/强化学习区分
order: 1
---

- 监督与无监督的区别
- 回归与分类
- 训练/验证/测试划分

```python
from sklearn.model_selection import train_test_split
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42)
```

**自查清单**
- [ ] 能划分数据集
- [ ] 区分任务类型
