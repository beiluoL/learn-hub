---
title: 垃圾收集器
category: java
module: java-jvm
subcat: roadmap
timeline: false
level: hard
tier: key
readMinutes: 12
tags: JVM 与调优
summary: Serial/Parallel/CMS/G1/ZGC 演进。
order: 3
---

- Serial：单线程，简单但停顿长。
- Parallel：吞吐优先，多线程收集。
- CMS：低停顿，并发标记清除（已废弃）。
- G1：分 Region，可预测停顿，主流。
- ZGC/Shenandoah：亚毫秒级停顿，大堆友好。

**自查清单**
- [ ] 能对比主流收集器
- [ ] 知道 G1 特点
- [ ] 了解 ZGC
