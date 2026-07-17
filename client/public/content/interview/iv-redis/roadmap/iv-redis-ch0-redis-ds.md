---
title: 数据结构
category: interview
module: iv-redis
subcat: roadmap
timeline: false
level: medium
tier: core
readMinutes: 11
tags: "Redis 面试, Redis, 数据结构"
summary: 五种基本类型与底层编码
order: 1
---

- String/Hash/List/Set/ZSet
- 底层：SDS、ziplist、skiplist、intset
- ZSet 用跳表+字典，范围查询高效

```bash
SET k v
HSET user:1 name tom age 18
ZADD rank 90 alice 85 bob
ZRANGE rank 0 -1 WITHSCORES
```

> 小数据用 ziplist 省内存，超过阈值转哈希表。

**自查清单**
- [ ] 能说类型
- [ ] 能说底层
