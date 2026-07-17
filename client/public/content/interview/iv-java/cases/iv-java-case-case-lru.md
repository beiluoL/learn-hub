---
title: 手写 LRU 缓存
category: interview
module: iv-java
subcat: cases
timeline: false
level: hard
tier: key
readMinutes: 18
tags: "Java 面试, 项目案例"
summary: 用 LinkedHashMap 或 HashMap+双向链表实现容量受限缓存
order: 1
---

- 维持访问顺序，淘汰最久未使用节点
- get/put 均为 O(1)
- LinkedHashMap 重写 removeEldestEntry

```java
class LRUCache extends LinkedHashMap<Integer, Integer> {
    private final int cap;
    LRUCache(int cap) { super(cap, 0.75f, true); this.cap = cap; }
    public int get(int k) { return super.getOrDefault(k, -1); }
    public void put(int k, int v) { super.put(k, v); }
    protected boolean removeEldestEntry(Map.Entry e) { return size() > cap; }
}
```

**自查清单**
- [ ] get/put 复杂度 O(1)
- [ ] 淘汰策略正确
- [ ] 线程安全可加分
