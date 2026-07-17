---
title: 排序算法
category: python
module: py-dsa
subcat: roadmap
timeline: false
level: hard
tier: key
readMinutes: 15
tags: 数据结构与算法
summary: 快排与归并的实现
order: 6
---

- 快速排序分治思想
- 归并排序稳定 O(n log n)
- 内置 sorted 的 TimSort
- key 参数自定义排序

```python
def quicksort(a):
    if len(a) <= 1:
        return a
    p = a[len(a) // 2]
    lo = [x for x in a if x < p]
    eq = [x for x in a if x == p]
    hi = [x for x in a if x > p]
    return quicksort(lo) + eq + quicksort(hi)

print(quicksort([3, 1, 2]))
```

**自查清单**
- [ ] 手写快排
- [ ] 会用 sorted(key=...)
