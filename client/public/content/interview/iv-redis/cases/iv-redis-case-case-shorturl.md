---
title: 设计短链系统
category: interview
module: iv-redis
subcat: cases
timeline: false
level: hard
tier: key
readMinutes: 18
tags: "Redis 面试, 项目案例"
summary: 发号器 + Redis 缓存 + 跳转
order: 2
---

- 长链哈希/发号器生成短码
- Redis 缓存热点映射
- 302 重定向返回原链

```bash
# 查询短码，命中缓存则直接跳转
GET short:Ab3x9
# 未命中回源数据库并回填
SET short:Ab3x9 https://origin.long/url EX 86400
```

**自查清单**
- [ ] 发号方案可行
- [ ] 缓存命中率高
