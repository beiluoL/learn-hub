---
title: 链表
category: interview
module: iv-algo
subcat: roadmap
timeline: false
level: medium
tier: core
readMinutes: 11
tags: "算法与数据结构, 链表"
summary: 反转、快慢指针与环检测
order: 2
---

- 反转链表：迭代三指针
- 快慢指针找中点/判环
- 合并/相交链表

```java
ListNode reverse(ListNode h) {
    ListNode p = null;
    while (h != null) {
        ListNode n = h.next;
        h.next = p;
        p = h; h = n;
    }
    return p;
}
```

> 环检测：快慢指针相遇则成环。

**自查清单**
- [ ] 能反转链表
- [ ] 能判环
