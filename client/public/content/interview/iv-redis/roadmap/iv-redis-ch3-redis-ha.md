---
title: 高可用架构
category: interview
module: iv-redis
subcat: roadmap
timeline: false
level: hard
tier: key
readMinutes: 13
tags: "Redis 面试, Redis, 高可用"
summary: 主从、哨兵与集群
order: 4
---

- 主从复制：全量 + 增量同步
- 哨兵监控与自动故障转移
- Cluster 分槽(16384)实现水平扩展

```bash
redis-cli --cluster create \
  127.0.0.1:7000 127.0.0.1:7001 127.0.0.1:7002 \
  --cluster-replicas 1

SENTINEL monitor mymaster 127.0.0.1 6379 2
```

> Cluster 模式下多 key 操作需注意槽位。

**自查清单**
- [ ] 能说主从哨兵
- [ ] 能说集群分槽
