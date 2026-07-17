---
title: List 体系
category: java
module: java-collection
subcat: roadmap
timeline: false
level: easy
tier: core
readMinutes: 12
tags: 集合框架
summary: ArrayList 与 LinkedList 的底层与选型。
order: 2
---

- `ArrayList`：数组实现，随机访问快，尾部增删快，中间插入慢。
- `LinkedList`：双向链表，插入删除快，随机访问慢。
- 扩容：ArrayList 默认 1.5 倍扩容。
- `Vector` 线程安全但性能差，基本被弃用。
- 遍历优先用 `for-each` 或 `Iterator`。

```java
List<String> list = new ArrayList<>();
list.add("a"); list.add("b");
for (String s : list) System.out.println(s);
```

**自查清单**
- [ ] 说清 ArrayList vs LinkedList
- [ ] 理解扩容机制
- [ ] 会用遍历
