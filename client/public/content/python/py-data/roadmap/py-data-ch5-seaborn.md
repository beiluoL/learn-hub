---
title: Seaborn 统计可视化
category: python
module: py-data
subcat: roadmap
timeline: false
level: medium
tier: extra
readMinutes: 12
tags: 数据分析 (NumPy/Pandas/Matplotlib)
summary: 高级统计图
order: 6
---

- sns 美化默认样式
- heatmap 相关性
- boxplot 分布
- pairplot 成对关系

```python
import seaborn as sns
import matplotlib.pyplot as plt

tips = sns.load_dataset("tips")
sns.boxplot(data=tips, x="day", y="total_bill")
plt.show()
```

**自查清单**
- [ ] 画箱线图
- [ ] 理解相关性热力图
