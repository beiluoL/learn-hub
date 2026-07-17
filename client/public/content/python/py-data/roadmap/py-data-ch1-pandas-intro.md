---
title: Pandas 数据结构
category: python
module: py-data
subcat: roadmap
timeline: false
level: medium
tier: core
readMinutes: 13
tags: 数据分析 (NumPy/Pandas/Matplotlib)
summary: Series 与 DataFrame
order: 2
---

- Series 带索引的一维
- DataFrame 二维表格
- read_csv 读取数据
- 列选择与方法链

```python
import pandas as pd

df = pd.read_csv("data.csv")
print(df.head())
print(df["price"].mean())
```

**自查清单**
- [ ] 读取 CSV
- [ ] 计算列均值
