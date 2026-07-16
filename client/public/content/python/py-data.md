---
title: 数据处理：NumPy 与 Pandas
category: python
level: intermediate
readMinutes: 15
tags: "NumPy, Pandas, 数据分析, 科学计算"
summary: 用向量化思想处理表格与数组数据，远离慢速 for 循环。
order: 5
---

## 一、NumPy：向量化计算

ndarray 是同构多维数组，底层 C 实现，向量化远快于 Python 循环：

```
import numpy as np
a = np.array([1, 2, 3])
b = a * 2            # 向量化，无需循环
c = np.where(a > 1, a, 0)
```

## 二、Pandas：表格分析

```
import pandas as pd
df = pd.read_csv("data.csv")
df.head()
df[df["score"] > 90]["name"]
grouped = df.groupby("class")["score"].mean()
df["pass"] = df["score"] >= 60
```

-   `Series`：带标签的一维数组；`DataFrame`：二维表格
-   常用：筛选、groupby、merge/join、pivot\_table、apply
-   避免对大 DataFrame 用 `apply` 逐行 Python 循环，优先向量化或 `eval`

## 三、典型数据管道

读取 → 清洗（去重/填充缺失）→ 特征工程 → 分析/建模 → 可视化（matplotlib / seaborn）。
