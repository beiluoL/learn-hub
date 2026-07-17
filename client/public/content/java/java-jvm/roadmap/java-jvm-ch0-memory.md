---
title: 内存结构
category: java
module: java-jvm
subcat: roadmap
timeline: false
level: medium
tier: basic
readMinutes: 12
tags: JVM 与调优
summary: 运行时数据区：堆、栈、方法区与直接内存。
order: 1
---

- 堆：对象实例，GC 主要区域，分新生代/老年代。
- 虚拟机栈：每个线程私有，存放栈帧（局部变量/操作数栈）。
- 方法区（元空间）：类信息、常量、静态变量。
- 程序计数器：当前线程执行位置。
- 直接内存：NIO 使用，不受堆大小限制但受本机内存约束。

**自查清单**
- [ ] 说清各区域职责
- [ ] 理解堆与栈区别
- [ ] 知道元空间
