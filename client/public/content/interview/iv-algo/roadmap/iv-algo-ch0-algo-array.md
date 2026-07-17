---
title: 数组与双指针
category: interview
module: iv-algo
subcat: roadmap
timeline: false
level: medium
tier: core
readMinutes: 10
tags: "算法与数据结构, 数组, 双指针"
summary: 双指针、滑动窗口与前缀和
order: 1
---

- 双指针：快慢指针、左右指针
- 滑动窗口处理子数组/子串最值
- 前缀和加速区间求和

```java
// 原地移除等于 val 的元素
int remove(int[] a, int val) {
    int k = 0;
    for (int x : a) if (x != val) a[k++] = x;
    return k;
}
```

> 双指针常把 O(n^2) 降到 O(n)。

**自查清单**
- [ ] 能写双指针
- [ ] 能说窗口伸缩
