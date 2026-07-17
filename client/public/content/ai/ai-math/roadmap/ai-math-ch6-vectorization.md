---
title: 向量化与性能
category: ai
module: ai-math
subcat: roadmap
timeline: false
level: medium
tier: extra
readMinutes: 10
tags: "Python 与数学基础, performance"
summary: 用向量化替代循环提速
order: 7
---

- 避免 Python 层循环
- 利用 ufunc
- 认识内存布局

```python
import numpy as np
v = np.random.rand(1000000)
# 向量化
res = (v * 2 + 1).sum()
print(res)
```

**自查清单**
- [ ] 写出向量化代码
- [ ] 对比循环性能
