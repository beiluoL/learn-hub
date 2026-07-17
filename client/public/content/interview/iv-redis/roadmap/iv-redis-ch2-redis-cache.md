---
title: 缓存问题与解决
category: interview
module: iv-redis
subcat: roadmap
timeline: false
level: hard
tier: key
readMinutes: 14
tags: "Redis 面试, Redis, 缓存"
summary: 穿透/击穿/雪崩与一致性
order: 3
---

- 穿透：布隆过滤器/空值缓存
- 击穿：互斥锁/逻辑过期
- 雪崩：随机过期 + 多级缓存

```bash
# 设置随机过期时间避免雪崩
SET k v EX 3600
PEXPIRE k 3600000 + rand(0, 600000)

# 布隆过滤器阻挡非法 key
BF.ADD blocked user:99999
```

> 缓存与 DB 一致性：先更新 DB 再删缓存(延迟双删)。

**自查清单**
- [ ] 能说三大问题
- [ ] 能说一致性
