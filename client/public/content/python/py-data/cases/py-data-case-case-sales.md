---
title: 销售数据分析
category: python
module: py-data
subcat: cases
timeline: false
level: medium
tier: core
readMinutes: 24
tags: "数据分析 (NumPy/Pandas/Matplotlib), 项目案例"
summary: 从原始 CSV 到洞察
order: 1
---

- 清洗缺失销售额
- 按月汇总趋势
- 绘制销售曲线
- 输出结论报告

```python
import pandas as pd

df = pd.read_csv("sales.csv", parse_dates=["date"])
df = df.dropna()
monthly = df.groupby(df["date"].dt.to_period("M"))["amount"].sum()
print(monthly)
```

**自查清单**
- [ ] 按月聚合
- [ ] 可视化趋势
