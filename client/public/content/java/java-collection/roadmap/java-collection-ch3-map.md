---
title: Map 体系
category: java
module: java-collection
subcat: roadmap
timeline: false
level: medium
tier: key
readMinutes: 12
tags: 集合框架
summary: HashMap 原理、红黑树与 ConcurrentHashMap。
order: 4
---

- `HashMap`：数组 + 链表/红黑树，默认负载因子 0.75。
- `put`：算 hash → 定位桶 → 冲突时链表/树化（阈值 8）。
- `LinkedHashMap` 保序，`TreeMap` 按 key 排序。
- `ConcurrentHashMap`：分段/细粒度锁，线程安全。
- 遍历用 `entrySet()` 而非 `keySet()` 再 get。

```java
Map<String, Integer> m = new HashMap<>();
m.put("a", 1);
for (var e : m.entrySet()) System.out.println(e.getKey() + e.getValue());
```

**自查清单**
- [ ] 讲清 HashMap put 流程
- [ ] 理解树化阈值
- [ ] 会遍历 Map
