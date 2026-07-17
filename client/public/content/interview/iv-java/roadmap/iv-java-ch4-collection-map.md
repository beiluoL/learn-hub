---
title: 集合框架
category: interview
module: iv-java
subcat: roadmap
timeline: false
level: medium
tier: core
readMinutes: 11
tags: "Java 面试, 集合, HashMap"
summary: HashMap、ConcurrentHashMap 与常见集合
order: 5
---

- HashMap：数组+链表+红黑树，负载因子 0.75，树化阈值 8
- 扩容：容量翻倍并 rehash，1.8 优化为高低位拆分
- ConcurrentHashMap：1.8 用 CAS + synchronized 锁桶
- ArrayList 与 LinkedList 的随机访问/插入差异

```java
Map<String, Integer> map = new ConcurrentHashMap<>();
map.put("a", 1);
map.computeIfAbsent("b", k -> 2);
System.out.println(map.get("b"));
```

> 1.7 及之前 ConcurrentHashMap 使用分段锁 Segment。

**自查清单**
- [ ] 能说 HashMap 扩容机制
- [ ] 能说 1.7 与 1.8 差异
