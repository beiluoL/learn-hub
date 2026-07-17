---
title: 排序与堆
category: interview
module: iv-algo
subcat: roadmap
timeline: false
level: medium
tier: core
readMinutes: 11
tags: "算法与数据结构, 排序, 堆"
summary: 快排/归并/堆排序与 TopK
order: 7
---

- 快排平均 O(n log n)，最坏 O(n^2)
- 归并稳定，需额外空间
- 堆用于 TopK 与优先队列

```java
int topK(int[] a, int k) {
    PriorityQueue<Integer> q = new PriorityQueue<>();
    for (int x : a) { q.offer(x); if (q.size() > k) q.poll(); }
    return q.peek();
}
```

> TopK 大数用最小堆，空间 O(k)。

**自查清单**
- [ ] 能说复杂度
- [ ] 能用堆解 TopK
