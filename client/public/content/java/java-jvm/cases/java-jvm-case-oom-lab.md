---
title: OOM 排查演练
category: java
module: java-jvm
subcat: cases
timeline: false
level: hard
tier: key
readMinutes: 20
tags: "JVM 与调优, 项目案例"
summary: 构造一个内存泄漏场景，用 jmap/jstack 定位并修复。
order: 1
---

- 用静态集合不断 add 制造泄漏。
- `jmap -histo` 找到异常增长的类。
- `jstack` 确认线程状态。
- 修复（及时清理/限容）并复测。

**自查清单**
- [ ] 能复现泄漏
- [ ] 会用工具定位
- [ ] 完成修复
