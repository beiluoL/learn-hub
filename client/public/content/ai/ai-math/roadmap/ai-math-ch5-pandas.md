---
title: Pandas 数据处理
category: ai
module: ai-math
subcat: roadmap
timeline: false
level: easy
tier: basic
readMinutes: 11
tags: "Python 与数学基础, pandas"
summary: DataFrame 选取、分组与缺失值
order: 6
---

- loc/iloc 选列选行
- groupby 聚合
- 缺失值处理

```python
import pandas as pd
df = pd.DataFrame({'x': [1, 2, None], 'g': ['a', 'a', 'b']})
print(df.groupby('g').mean(numeric_only=True))
print(df.fillna(0))
```

**自查清单**
- [ ] 会 groupby
- [ ] 能处理 NaN
