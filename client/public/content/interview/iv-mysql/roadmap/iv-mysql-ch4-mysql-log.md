---
title: 日志与 binlog
category: interview
module: iv-mysql
subcat: roadmap
timeline: false
level: medium
tier: core
readMinutes: 11
tags: "MySQL 面试, MySQL, 日志"
summary: redo/undo/binlog 与两阶段提交
order: 5
---

- redo log 保证持久性，Crash Safe
- undo log 支持回滚与 MVCC
- binlog 用于主从复制与恢复
- 两阶段提交保证一致性

```sql
SHOW VARIABLES LIKE 'log_bin';
SHOW BINARY LOGS;
-- 主从基于 binlog 位点/GTID 复制
```

> WAL：先写日志再写磁盘。

**自查清单**
- [ ] 能说三类日志
- [ ] 能说两阶段提交
