---
title: 手写斐波那契(递归/动态/生成器)
category: interview
module: iv-py
subcat: cases
timeline: false
level: medium
tier: key
readMinutes: 12
tags: "Python 面试, 项目案例"
summary: 多种实现对比时间与空间复杂度
order: 1
---

- 朴素递归 O(2^n)，存在重复子问题
- 记忆化/动态规划 O(n)
- 生成器惰性输出序列

```python
def fib(n):
    a, b = 0, 1
    for _ in range(n):
        a, b = b, a + b
    return a
```

**自查清单**
- [ ] 多种写法
- [ ] 复杂度分析正确
