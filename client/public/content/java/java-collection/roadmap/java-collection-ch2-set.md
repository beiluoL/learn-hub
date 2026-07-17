---
title: Set 体系
category: java
module: java-collection
subcat: roadmap
timeline: false
level: medium
tier: core
readMinutes: 12
tags: 集合框架
summary: HashSet/TreeSet/LinkedHashSet 与去重原理。
order: 3
---

- `HashSet`：基于 HashMap，依赖 `hashCode()` + `equals()` 去重。
- `TreeSet`：基于红黑树，元素有序（需 Comparable/Comparator）。
- `LinkedHashSet`：维护插入顺序。
- 重写 equals 必须重写 hashCode（约定相同对象同 hash）。
- 去重场景首选 HashSet。

**自查清单**
- [ ] 理解 HashSet 去重原理
- [ ] 会重写 hashCode/equals
- [ ] 区分三种 Set
