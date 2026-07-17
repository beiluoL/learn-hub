---
title: 存储引擎
category: interview
module: iv-mysql
subcat: roadmap
timeline: false
level: easy
tier: basic
readMinutes: 8
tags: "MySQL 面试, MySQL, 引擎"
summary: InnoDB 与 MyISAM 对比
order: 6
---

- InnoDB 支持事务/行锁/外键/聚簇索引
- MyISAM 表锁、读快、无事务
- Memory 引擎数据在内存

```sql
CREATE TABLE t (
  id INT PRIMARY KEY
) ENGINE=InnoDB;
```

> MySQL 5.5 起默认 InnoDB。

**自查清单**
- [ ] 能对比引擎
- [ ] 能选引擎
