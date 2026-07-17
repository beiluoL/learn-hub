---
title: 调优实战
category: java
module: java-jvm
subcat: roadmap
timeline: false
level: hard
tier: key
readMinutes: 12
tags: JVM 与调优
summary: OOM 与 CPU 飙高的定位思路。
order: 6
---

- OOM：堆溢出看对象占用，栈溢出看递归深度。
- CPU 飙高：`top -Hp` + `jstack` 定位热点线程。
- 内存泄漏：对比多次堆转储找增长对象。
- 调优目标：吞吐与停顿的权衡。
- 先在压测环境复现，再调参验证。

**自查清单**
- [ ] 能定位 OOM
- [ ] 会查 CPU 飙高
- [ ] 有调优闭环
