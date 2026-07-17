---
title: 数据读写格式
category: python
module: py-data
subcat: roadmap
timeline: false
level: easy
tier: extra
readMinutes: 10
tags: 数据分析 (NumPy/Pandas/Matplotlib)
summary: CSV/JSON/Excel/Parquet
order: 7
---

- to_csv / to_json
- read_excel 读表格
- Parquet 列式高效
- 压缩与性能权衡

```python
import pandas as pd

df = pd.DataFrame({"x": [1, 2]})
df.to_parquet("out.parquet")
df2 = pd.read_parquet("out.parquet")
print(df2)
```

**自查清单**
- [ ] 读写 Parquet
- [ ] 理解格式优劣
