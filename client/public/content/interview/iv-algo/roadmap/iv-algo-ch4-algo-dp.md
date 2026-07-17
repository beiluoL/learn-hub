---
title: 动态规划
category: interview
module: iv-algo
subcat: roadmap
timeline: false
level: hard
tier: key
readMinutes: 14
tags: "算法与数据结构, DP"
summary: 状态定义、转移与背包问题
order: 5
---

- 五步法：定义状态→转移→初始化→遍历→优化
- 0-1 背包、最长子序列
- 滚动数组压缩空间

```java
int maxSub(int[] a) {
    int dp = a[0], ans = dp;
    for (int i = 1; i < a.length; i++) {
        dp = Math.max(a[i], dp + a[i]);
        ans = Math.max(ans, dp);
    }
    return ans;
}
```

> DP 关键是状态转移的正确性。

**自查清单**
- [ ] 能定义状态
- [ ] 能写出转移
