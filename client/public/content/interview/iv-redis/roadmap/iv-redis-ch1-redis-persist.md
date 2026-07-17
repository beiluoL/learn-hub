---
title: 持久化
category: interview
module: iv-redis
subcat: roadmap
timeline: false
level: hard
tier: key
readMinutes: 12
tags: "Redis 面试, Redis, 持久化"
summary: RDB 与 AOF 对比
order: 2
---

- RDB 快照，恢复快，可能丢数据
- AOF 追加命令，可配置 everysec
- 混合持久化兼顾速度与安全

```bash
appendonly yes
appendfsync everysec
save 900 1      # 900s 内 1 次修改则快照
save 300 10
```

> AOF 重写压缩历史命令。

**自查清单**
- [ ] 能对比 RDB/AOF
- [ ] 能说混合
