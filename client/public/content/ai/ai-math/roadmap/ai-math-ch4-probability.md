---
title: 概率与统计
category: ai
module: ai-math
subcat: roadmap
timeline: false
level: medium
tier: core
readMinutes: 14
tags: "Python 与数学基础, probability"
summary: 分布、期望、方差与贝叶斯
order: 5
---

- 常见分布（正态/伯努利）
- 期望与方差
- 条件概率与贝叶斯公式

```python
import numpy as np
samples = np.random.normal(0, 1, 10000)
print(samples.mean(), samples.var())

# 贝叶斯: P(A|B) = P(B|A)P(A)/P(B)
pa, pb_given_a = 0.01, 0.9
pb = pa * pb_given_a + 0.99 * 0.1
print(pa * pb_given_a / pb)
```

**自查清单**
- [ ] 会采样与算统计量
- [ ] 理解贝叶斯
