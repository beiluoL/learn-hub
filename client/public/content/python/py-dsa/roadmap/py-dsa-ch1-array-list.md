---
title: 数组与链表
category: python
module: py-dsa
subcat: roadmap
timeline: false
level: medium
tier: core
readMinutes: 14
tags: 数据结构与算法
summary: list 底层与手写链表
order: 2
---

- list 动态数组的扩容
- append/pop 的均摊复杂度
- 手写单向链表节点
- 插入删除的差异

```python
class Node:
    def __init__(self, val, nxt=None):
        self.val = val
        self.next = nxt

head = Node(1, Node(2, Node(3)))
cur = head
while cur:
    print(cur.val)
    cur = cur.next
```

**自查清单**
- [ ] 手写链表遍历
- [ ] 理解 list 扩容
