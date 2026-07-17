---
title: LRU 缓存
category: python
module: py-dsa
subcat: cases
timeline: false
level: hard
tier: key
readMinutes: 28
tags: "数据结构与算法, 项目案例"
summary: 用 OrderedDict 实现最近最少使用
order: 1
---

- get/put 均为 O(1)
- 命中后移到队首
- 超容量淘汰队尾
- 利用 OrderedDict.move_to_end

```python
from collections import OrderedDict

class LRU:
    def __init__(self, cap):
        self.cap, self.d = cap, OrderedDict()

    def get(self, k):
        if k not in self.d:
            return -1
        self.d.move_to_end(k)
        return self.d[k]

    def put(self, k, v):
        self.d[k] = v
        self.d.move_to_end(k)
        if len(self.d) > self.cap:
            self.d.popitem(last=False)
```

**自查清单**
- [ ] get/put O(1)
- [ ] 正确淘汰最旧项
