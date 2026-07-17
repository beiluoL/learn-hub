---
title: 垃圾回收算法
category: java
module: java-jvm
subcat: roadmap
timeline: false
level: hard
tier: core
readMinutes: 12
tags: JVM 与调优
summary: 标记清除/复制/整理与分代收集思想。
order: 2
---

- 判断无用对象：引用计数（有环问题）/ 可达性分析。
- 标记-清除：简单但有碎片。
- 复制算法：无碎片但浪费一半空间（新生代用）。
- 标记-整理：无碎片，适合老年代。
- 分代收集：新生代用复制，老年代用整理。

**自查清单**
- [ ] 理解可达性分析
- [ ] 区分三种算法
- [ ] 理解分代思路
