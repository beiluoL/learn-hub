---
title: 无监督学习
category: ai
module: ai-ml
subcat: roadmap
timeline: false
level: medium
tier: core
readMinutes: 13
tags: "机器学习, clustering, pca"
summary: 聚类与降维
order: 4
---

- K-Means 聚类
- PCA 降维
- t-SNE 可视化

```python
from sklearn.cluster import KMeans
km = KMeans(n_clusters=3, random_state=0).fit(X)
print(km.labels_)
```

**自查清单**
- [ ] 跑通聚类
- [ ] 理解降维
