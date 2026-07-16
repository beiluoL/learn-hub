---
title: 集合框架：List / Set / Map
category: java
level: intermediate
readMinutes: 16
tags: "集合, HashMap, 并发, 性能"
summary: 吃透 Java 集合体系，重点理解 HashMap 的底层结构与扩容机制。
order: 3
---

## 一、集合体系概览

-   **List**（有序可重复）：ArrayList、LinkedList、Vector
-   **Set**（不可重复）：HashSet、LinkedHashSet、TreeSet
-   **Map**（键值对）：HashMap、LinkedHashMap、TreeMap、ConcurrentHashMap

## 二、ArrayList vs LinkedList

绝大多数场景优先 ArrayList；频繁在首尾增删才考虑 LinkedList。

## 三、HashMap 核心原理

JDK 1.8 后结构为**数组 + 链表 + 红黑树**：

-   key 计算 hash，定位桶下标：(n - 1) & hash
-   链表长度 >= 8 且数组容量 >= 64 时转红黑树，<= 6 退化回链表
-   负载因子默认 0.75，容量达 `容量×0.75` 时扩容为 2 倍并 rehash

```
Map<String, Integer> map = new HashMap<>();
map.put("a", 1);
map.getOrDefault("b", 0);
```

线程安全请用 `ConcurrentHashMap`（分段/CAS + synchronized 锁桶），不要用 `Hashtable` 或 `Collections.synchronizedMap`（粗粒度锁，性能差）。

| 操作 | ArrayList | LinkedList |
| --- | --- | --- |
| 随机访问 | O(1) 快 | O(n) 慢 |
| 尾部插入 | 均摊 O(1) | O(1) |
| 中间插入 | O(n) 搬移 | O(1) 改指针 |
