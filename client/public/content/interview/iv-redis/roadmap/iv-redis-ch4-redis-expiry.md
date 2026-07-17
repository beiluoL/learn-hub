---
title: 过期删除策略
category: interview
module: iv-redis
subcat: roadmap
timeline: false
level: medium
tier: core
readMinutes: 10
tags: "Redis 面试, Redis, 过期"
summary: 惰性删除与定期删除
order: 5
---

- 惰性：访问时检查过期
- 定期：随机抽取部分 key 删除
- 内存淘汰：LRU/LFU/Random/TTL

```bash
maxmemory 2gb
maxmemory-policy allkeys-lru
TTL k
EXPIRE k 60
```

> LFU 比 LRU 更能反映访问频率。

**自查清单**
- [ ] 能说删除策略
- [ ] 能说淘汰策略
