---
title: 锁机制
category: interview
module: iv-mysql
subcat: roadmap
timeline: false
level: hard
tier: key
readMinutes: 12
tags: "MySQL 面试, MySQL, 锁"
summary: "行锁、间隙锁与 Next-Key Lock"
order: 3
---

- Record Lock/ Gap Lock / Next-Key Lock
- Next-Key = 记录锁 + 间隙锁，防幻读
- 死锁检测与回滚

```sql
SELECT * FROM t WHERE id = 5 FOR UPDATE;
-- 加行锁(记录存在), 否则退化为间隙锁
```

> 无索引的更新会升级为表锁。

**自查清单**
- [ ] 能说三类锁
- [ ] 能说死锁处理
