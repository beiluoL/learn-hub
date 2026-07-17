---
title: 设计分库分表方案
category: interview
module: iv-mysql
subcat: cases
timeline: false
level: hard
tier: key
readMinutes: 18
tags: "MySQL 面试, 项目案例"
summary: 按 user_id 哈希分片并规避热点
order: 1
---

- 分片键选择、路由规则
- 全局唯一 ID(snowflake/号段)
- 跨分片聚合与迁移方案

```sql
-- 按 user_id % 16 路由到 16 个库
SELECT * FROM order_${user_id % 16}
WHERE user_id = ?;
-- 全局 ID: 雪花算法 时间戳+机器+序列
```

**自查清单**
- [ ] 分片键合理
- [ ] ID 方案可行
