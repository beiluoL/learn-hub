---
title: 分组聚合
category: python
module: py-data
subcat: roadmap
timeline: false
level: medium
tier: key
readMinutes: 13
tags: 数据分析 (NumPy/Pandas/Matplotlib)
summary: groupby 统计
order: 4
---

- groupby 按列分组
- agg 多聚合函数
- pivot_table 透视
- value_counts 计数

```python
import pandas as pd

df = pd.DataFrame({"cat": ["a", "a", "b"], "v": [1, 2, 3]})
print(df.groupby("cat")["v"].agg(["sum", "mean"]))
```

**自查清单**
- [ ] 按类别分组
- [ ] 做聚合统计
