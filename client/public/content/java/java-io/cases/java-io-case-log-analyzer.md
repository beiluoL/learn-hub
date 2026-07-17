---
title: 日志文件分析器
category: java
module: java-io
subcat: cases
timeline: false
level: medium
tier: core
readMinutes: 20
tags: "异常与 IO, 项目案例"
summary: 读取日志文件，统计 ERROR 行数、抽取 Top IP 等。
order: 1
---

- 用 BufferedReader 逐行读取。
- 正则匹配 ERROR / WARN 级别。
- 用 Map 统计各维度出现次数。
- 输出汇总报告。

**自查清单**
- [ ] 能读取大文件
- [ ] 用正则过滤
- [ ] 输出统计结果
