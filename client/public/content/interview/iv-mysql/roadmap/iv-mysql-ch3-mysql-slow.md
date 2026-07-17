---
title: 慢查询优化
category: interview
module: iv-mysql
subcat: roadmap
timeline: false
level: hard
tier: key
readMinutes: 14
tags: "MySQL 面试, MySQL, 优化"
summary: 执行计划与优化思路
order: 4
---

- 慢查询日志 + EXPLAIN 分析
- 关注 type、rows、Extra
- 避免 SELECT *、大分页、深分页

```sql
SELECT * FROM orders
WHERE user_id = 1
ORDER BY id DESC
LIMIT 100000, 10;  -- 深分页慢

-- 优化: 游标分页
SELECT * FROM orders
WHERE id < 1000000
ORDER BY id DESC LIMIT 10;
```

> type 从 ALL 到 const 越优。

**自查清单**
- [ ] 会读 EXPLAIN
- [ ] 能优化慢 SQL
