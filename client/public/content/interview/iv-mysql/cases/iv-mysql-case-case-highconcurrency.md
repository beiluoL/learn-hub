---
title: 超高并发扣减库存
category: interview
module: iv-mysql
subcat: cases
timeline: false
level: hard
tier: key
readMinutes: 16
tags: "MySQL 面试, 项目案例"
summary: 乐观锁/行锁防止超卖
order: 2
---

- UPDATE ... SET stock=stock-1 WHERE stock>0
- 乐观锁版本号防超卖
- Redis 预扣 + 异步落库

```sql
UPDATE item
SET stock = stock - 1
WHERE id = ? AND stock > 0;
-- 受影响行数=1 表示扣减成功
```

**自查清单**
- [ ] 防超卖正确
- [ ] 能说优化
