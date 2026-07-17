---
title: 哈希表
category: python
module: py-dsa
subcat: roadmap
timeline: false
level: medium
tier: core
readMinutes: 12
tags: 数据结构与算法
summary: dict 的哈希原理
order: 4
---

- 哈希函数与桶
- dict 平均 O(1) 查找
- 哈希冲突与链表法
- 可哈希对象需实现 __hash__

```python
freq = {}
for ch in "abracadabra":
    freq[ch] = freq.get(ch, 0) + 1
print(freq)
```

**自查清单**
- [ ] 统计字符频率
- [ ] 理解哈希查找
