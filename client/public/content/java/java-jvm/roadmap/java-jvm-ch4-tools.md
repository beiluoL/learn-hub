---
title: 运行时参数与工具
category: java
module: java-jvm
subcat: roadmap
timeline: false
level: hard
tier: key
readMinutes: 12
tags: JVM 与调优
summary: 常用 JVM 参数与诊断命令。
order: 5
---

- `-Xms/-Xmx` 堆初始/最大；`-Xss` 栈大小。
- `jps` 查进程，`jstat` 看 GC，`jmap` 看堆。
- `jstack` 抓线程栈（排查死锁/卡顿）。
- `jcmd` 综合诊断；`jhat`/MAT 分析堆转储。
- GC 日志：`-Xlog:gc*` 输出分析。

**自查清单**
- [ ] 会设堆参数
- [ ] 会用 jps/jstat
- [ ] 会用 jstack
