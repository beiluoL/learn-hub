---
title: 分布式锁
category: interview
module: iv-redis
subcat: roadmap
timeline: false
level: hard
tier: key
readMinutes: 13
tags: "Redis 面试, Redis, 分布式锁"
summary: SET NX 与 Redlock 探讨
order: 7
---

- SET key val NX PX 实现互斥
- 需唯一 value 防误删，Lua 释放
- Redlock 多节点提升可靠性

```bash
SET lock:order  uuid NX PX 30000
-- 释放(校验 value 后删)
EVAL "if redis.call('GET',KEYS[1])==ARGV[1] then return redis.call('DEL',KEYS[1]) else return 0 end" 1 lock:order uuid
```

> 锁需设置看门狗自动续期，防业务超时。

**自查清单**
- [ ] 能实现锁
- [ ] 能说释放安全
