---
title: 二分查找
category: interview
module: iv-algo
subcat: roadmap
timeline: false
level: medium
tier: core
readMinutes: 9
tags: "算法与数据结构, 二分"
summary: 边界处理与变种
order: 6
---

- 循环不变量保证正确性
- 左闭右闭 vs 左闭右开
- 找第一个/最后一个等于 target

```java
int bs(int[] a, int t) {
    int l = 0, r = a.length - 1;
    while (l <= r) {
        int m = l + (r - l) / 2;
        if (a[m] == t) return m;
        else if (a[m] < t) l = m + 1;
        else r = m - 1;
    }
    return -1;
}
```

> m = l + (r-l)/2 防整数溢出。

**自查清单**
- [ ] 能写二分
- [ ] 能处理边界
