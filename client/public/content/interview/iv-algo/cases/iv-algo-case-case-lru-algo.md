---
title: 手写 LRU (算法版)
category: interview
module: iv-algo
subcat: cases
timeline: false
level: hard
tier: key
readMinutes: 20
tags: "算法与数据结构, 项目案例"
summary: HashMap + 双向链表实现 O(1) 缓存
order: 1
---

- 头插新节点，尾删最旧
- 命中移动到头部
- get/put O(1)

```java
class Node { int k, v; Node prev, next; }
class LRU {
    Map<Integer, Node> m = new HashMap<>();
    Node head = new Node(), tail = new Node();
    int cap;
    LRU(int c){ cap=c; head.next=tail; tail.prev=head; }
}
```

**自查清单**
- [ ] 结构正确
- [ ] get/put O(1)
- [ ] 边界处理
