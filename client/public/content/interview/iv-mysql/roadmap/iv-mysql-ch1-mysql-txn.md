---
title: 事务与隔离级别
category: interview
module: iv-mysql
subcat: roadmap
timeline: false
level: hard
tier: key
readMinutes: 12
tags: "MySQL 面试, MySQL, 事务"
summary: ACID 与脏读/不可重复读/幻读
order: 2
---

- 隔离级别：读未提交/读已提交/可重复读/串行
- 可重复读默认级别，靠 MVCC 实现
- RR 下幻读由间隙锁解决

```sql
SET TRANSACTION ISOLATION LEVEL REPEATABLE READ;
START TRANSACTION;
SELECT * FROM t WHERE id = 1;
COMMIT;
```

> MVCC 通过 undo log 与 ReadView 实现快照读。

**自查清单**
- [ ] 能说四个级别
- [ ] 能说 MVCC
