---
title: 两数之和与变体
category: interview
module: iv-algo
subcat: cases
timeline: false
level: easy
tier: core
readMinutes: 12
tags: "算法与数据结构, 项目案例"
summary: 哈希表 O(n) 解法与三数之和
order: 2
---

- 哈希存值与下标
- 排序双指针处理三数之和去重

```java
int[] twoSum(int[] a, int t) {
    Map<Integer, Integer> m = new HashMap<>();
    for (int i = 0; i < a.length; i++) {
        if (m.containsKey(t - a[i])) return new int[]{m.get(t-a[i]), i};
        m.put(a[i], i);
    }
    return new int[]{};
}
```

**自查清单**
- [ ] 哈希解法正确
- [ ] 复杂度分析
