---
title: 索引原理
category: interview
module: iv-mysql
subcat: roadmap
timeline: false
level: hard
tier: key
readMinutes: 13
tags: "MySQL 面试, MySQL, 索引"
summary: B+ 树、聚簇索引与最左前缀
order: 1
---

- InnoDB 聚簇索引叶子存整行，二级索引存主键
- B+ 树多路平衡，矮胖适合磁盘
- 最左前缀原则、覆盖索引、回表

```sql
EXPLAIN SELECT * FROM user
WHERE name = 'a' AND age > 18;
-- 联合索引 (name, age) 可命中
```

> 索引失效：函数/隐式转换/前导模糊。

**自查清单**
- [ ] 能说 B+ 树
- [ ] 能说最左前缀
