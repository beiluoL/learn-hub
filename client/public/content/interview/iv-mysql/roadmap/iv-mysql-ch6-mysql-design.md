---
title: 表设计与范式
category: interview
module: iv-mysql
subcat: roadmap
timeline: false
level: medium
tier: core
readMinutes: 10
tags: "MySQL 面试, MySQL, 设计"
summary: 三大范式与反范式权衡
order: 7
---

- 1NF 原子性、2NF 消除部分依赖、3NF 消除传递依赖
- 适当冗余减少 JOIN，提升读性能
- 字段类型越小越优，避免过度设计

```sql
CREATE TABLE order_item (
  id BIGINT PRIMARY KEY,
  order_id BIGINT NOT NULL,
  sku VARCHAR(64),
  qty INT,
  INDEX (order_id)
);
```

> 反范式以空间换时间，需保证一致性。

**自查清单**
- [ ] 能说范式
- [ ] 能做权衡
