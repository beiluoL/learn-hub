---
title: 原子操作与 Lua
category: interview
module: iv-redis
subcat: roadmap
timeline: false
level: medium
tier: core
readMinutes: 12
tags: "Redis 面试, Redis, 原子"
summary: 事务、CAS 与 Lua 脚本
order: 6
---

- 单命令原子；MULTI/EXEC 非严格事务
- WATCH 实现乐观锁
- Lua 脚本保证复杂操作原子性

```bash
WATCH balance
MULTI
DECRBY balance 10
EXEC

-- Lua 原子限流
EVAL "local c=redis.call('INCR',KEYS[1]) if c==1 then redis.call('EXPIRE',KEYS[1],1) end return c" 1 rl:ip
```

> Redis 事务不支持回滚，失败仅报错。

**自查清单**
- [ ] 能说事务
- [ ] 能写 Lua
