---
title: 手写分布式限流
category: interview
module: iv-redis
subcat: cases
timeline: false
level: hard
tier: key
readMinutes: 16
tags: "Redis 面试, 项目案例"
summary: 基于 Redis 的滑动窗口/令牌桶限流
order: 1
---

- 计数器 + TTL 简易限流
- Lua 保证原子性
- 滑动窗口比固定窗口更平滑

```bash
EVAL "local n=redis.call('INCR',KEYS[1]) if n==1 then redis.call('EXPIRE',KEYS[1],ARGV[1]) end if n>tonumber(ARGV[2]) then return 0 end return 1" 1 limit:ip 1 100
```

**自查清单**
- [ ] 原子性正确
- [ ] 限流维度合理
