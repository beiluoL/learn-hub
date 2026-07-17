---
title: Matplotlib 绘图
category: python
module: py-data
subcat: roadmap
timeline: false
level: medium
tier: core
readMinutes: 13
tags: 数据分析 (NumPy/Pandas/Matplotlib)
summary: 折线图与柱状图
order: 5
---

- plot 折线图
- bar 柱状图
- 标题/轴标签/图例
- subplots 多子图

```python
import matplotlib.pyplot as plt

x = [1, 2, 3]
y = [3, 1, 2]
plt.plot(x, y, marker="o")
plt.title("示例")
plt.xlabel("x")
plt.show()
```

**自查清单**
- [ ] 画折线图
- [ ] 加标题与轴标签
