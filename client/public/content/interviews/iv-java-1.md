---
question: HashMap 和 ConcurrentHashMap 的区别？ConcurrentHashMap 如何保证线程安全？
category: java
difficulty: middle
tags: "集合, 并发, HashMap"
order: 1
---

**区别：**HashMap 非线程安全，多线程下扩容可能死循环/数据丢失；ConcurrentHashMap 线程安全且高并发。

**实现（JDK 1.8）：**抛弃分段锁，改为 **CAS + synchronized 锁单个桶（头节点）**。

-   读操作基本无锁（volatile 保证可见性）
-   写操作只对当前桶加细粒度锁，其他桶可并发
-   链表转红黑树阈值仍为 8

对比 Hashtable（方法级 synchronized，整体一把锁，并发差）和 Collections.synchronizedMap（同理）。
