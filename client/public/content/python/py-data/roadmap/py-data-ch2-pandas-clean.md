---
title: 数据清洗
category: python
module: py-data
subcat: roadmap
timeline: false
level: medium
tier: core
readMinutes: 14
tags: 数据分析 (NumPy/Pandas/Matplotlib)
summary: 处理缺失与重复
order: 3
---

- dropna/ fillna 缺失值
- duplicated 去重
- astype 类型转换
- apply 自定义变换

```python
import pandas as pd

df = pd.DataFrame({"a": [1, None, 1], "b": [2, 3, 2]})
df = df.dropna().drop_duplicates()
df["a"] = df["a"].astype(int)
print(df)
```

**自查清单**
- [ ] 处理缺失值
- [ ] 去除重复行
