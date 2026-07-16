---
title: Redis 持久化与高可用：RDB/AOF、主从、哨兵与集群
category: java
level: intermediate
readMinutes: 20
order: 57
tags: "Redis, RDB, AOF, 主从, 哨兵, 集群"
summary: 讲解持久化机制与哨兵、Cluster 集群的高可用方案。
prereq: java/java-redis-basics
---

## 为什么需要持久化

Redis 是内存数据库，数据存在内存里，重启或宕机就会丢失。持久化把内存数据落到磁盘，用于**重启恢复**和**数据备份**。Redis 提供两种持久化方式：RDB 和 AOF，可单独用也可同时用。

## RDB：内存快照

**RDB（Redis Database）** 在指定触发条件下，把某一时刻的内存全量数据以二进制快照形式写入 `.rdb` 文件。

触发方式：
- 手动：`SAVE`（主线程阻塞，生产禁用）、`BGSAVE`（fork 子进程后台写，不阻塞）。
- 自动：配置文件 `save 900 1`（900 秒内至少 1 次修改）、`save 300 10`、`save 60 10000`。

**原理——写时复制（Copy On Write）**：`BGSAVE` 时 Redis 调用 `fork()` 创建子进程，父子进程共享同一块物理内存。子进程读内存写快照，父进程继续服务；当父进程修改某块内存，内核才**复制**那一块给父进程，子进程看到的仍是旧数据，从而保证快照一致性，且几乎不额外占内存。

**优点**：文件紧凑、恢复快（直接加载二进制）、适合全量备份和灾难恢复。
**缺点**：两次快照之间的数据会丢失（如每 5 分钟一次，最多丢 5 分钟数据）；`fork` 大内存时可能有短暂阻塞。

```bash
# 手动触发后台快照
redis-cli BGSAVE
# 查看最后一次 RDB 成功时间等信息
redis-cli INFO persistence
```

## AOF：追加日志

**AOF（Append Only File）** 记录每一条写命令，以文本协议格式追加到文件末尾，重启时重放命令恢复数据。

**fsync 策略**（控制落盘时机，在 `appendfsync` 配置）：
- `always`：每条写命令都 fsync 到磁盘，最安全但最慢。
- `everysec`：每秒 fsync 一次（默认），最多丢 1 秒数据，兼顾安全与性能。
- `no`：由操作系统决定，性能最好但可能丢较多数据。

**AOF 重写（Rewrite）**：随着时间推移 AOF 文件会膨胀（如对同一 key 改了 100 次，文件有 100 条命令）。Redis 会 `fork` 子进程遍历当前内存，生成"只含当前状态的最小命令集"的新 AOF 文件，替换旧文件，从而压缩体积。

```bash
# 手动触发 AOF 重写
redis-cli BGREWRITEAOF
```

**优点**：数据更安全（everysec 最多丢 1 秒）；可读、便于审计。
**缺点**：文件通常比 RDB 大；恢复时要重放命令，比 RDB 慢。

## 混合持久化

Redis 4.0 起支持 **RDB-AOF 混合持久化**（`aof-use-rdb-preamble yes`）：AOF 重写时，先以 RDB 格式写全量快照，再把之后的增量命令以 AOF 格式追加。重启时先加载 RDB 部分（快），再重放增量 AOF（少），兼顾恢复速度与数据完整。

## 主从复制：读写分离基础

**主从复制（Replication）** 让一个 Redis（主节点 master）的数据复制到一个或多个从节点（replica/slave）。

- **全量复制**：从节点首次连接主节点，主节点 `BGSAVE` 生成 RDB 发给从节点加载，期间的新写命令缓存后补发。
- **增量复制**：全量完成后，主节点把写命令持续发给从节点，保持同步。
- 默认从节点**只读**，承载读流量，实现读写分离。

配置（Redis 5.0+）：

```bash
# 在从节点执行，指向主节点
replicaof 127.0.0.1 6379
# 或写入配置文件
# replicaof 127.0.0.1 6379
```

```java
// 通过 Spring 配置读写分离（示意）：写走 master，读走 replica
// 实际可用 Lettuce 的 MasterReplica 或 ShardingSphere 路由
```

## 哨兵（Sentinel）：自动故障转移

**哨兵**是解决"主节点挂了怎么办"的方案。一组哨兵进程持续监控主从节点：

- **监控**：定期发心跳检测节点是否存活。
- **通知**：节点异常时发告警。
- **自动故障转移**：当多数哨兵判定主节点**主观下线（SDown）**，并达成一致认为**客观下线（ODown）**，哨兵会选举一个从节点提升为新主节点，并让其他从节点复制新主，通知客户端新地址。

哨兵本身也要部署多个（奇数，如 3 个）避免哨兵自己单点。

```bash
# sentinel.conf 关键配置
sentinel monitor mymaster 127.0.0.1 6379 2   # 监控 mymaster，quorum=2 个哨兵同意才判定客观下线
sentinel down-after-milliseconds mymaster 5000
sentinel failover-timeout mymaster 10000
```

## Redis Cluster：数据分片集群

当数据量超过单机内存，或要更高写吞吐，用 **Redis Cluster** 把数据分散到多台机器。

- **16384 个哈希槽（slot）**：Cluster 把数据按 `CRC16(key) % 16384` 映射到某个 slot，slot 再分配给各主节点。
- **数据分片**：每个主节点负责一部分 slot，实现水平扩展。
- **gossip 协议**：节点间通过 gossip 互相交换集群状态，最终一致。
- **高可用**：每个主节点可挂从节点，主挂后从节点顶上。
- **扩缩容**：增删节点时用 `redis-cli --cluster reshard` 把 slot 迁移到新节点（迁移期间 key 会临时返回 MOVED/ASK 重定向，客户端自动处理）。

```bash
# 创建 3 主 3 从集群（示意）
redis-cli --cluster create \
  127.0.0.1:7000 127.0.0.1:7001 127.0.0.1:7002 \
  127.0.0.1:7003 127.0.0.1:7004 127.0.0.1:7005 \
  --cluster-replicas 1

# 查看集群状态
redis-cli -c -p 7000 cluster info
redis-cli -c -p 7000 cluster nodes
```

```bash
# 扩容：把 1000 个 slot 从节点 7000 迁移到新节点 7006
redis-cli --cluster reshard 127.0.0.1:7000 \
  --cluster-from <node-id-7000> \
  --cluster-to <node-id-7006> \
  --cluster-slots 1000 --cluster-yes
```

## key 的过期策略

Redis 删除过期 key 用两种方式配合：

- **惰性删除**：访问 key 时才检查是否过期，过期则删除。优点省 CPU，缺点是长期不访问的过期 key 占内存。
- **定期删除**：定时随机抽样一批设置了过期的 key，删除其中已过期的，控制抽样数量和频率，在 CPU 和内存间折中。

两者结合，既不过度消耗 CPU，也不会让过期 key 长时间堆积。

## 实际开发中的应用 / 常见问题

**问题一：RDB 和 AOF 同时开，恢复时用哪个？**
Redis 重启时若 AOF 开启，优先用 AOF 恢复（数据更全）；AOF 关闭才用 RDB。生产环境推荐两者都开，用混合持久化兼顾速度与完整性。

**问题二：主从延迟导致读不到刚写的数据？**
主从是异步复制，写后立刻读可能读从节点拿到旧值。对一致性要求高的读指定走主节点，或接受短暂延迟。

**问题三：Cluster 下能跨 slot 做事务/多 key 操作吗？**
Cluster 要求**一个命令涉及的多个 key 必须在同一个 slot**（用 hash tag `{user100}` 强制同 slot），否则报错 `CROSSSLOT`。需要跨 slot 事务要借助客户端聚合或 hash tag 设计。

**问题四：哨兵和 Cluster 怎么选？**
哨兵解决"高可用（故障转移）"但仍是单 master 写，数据量受单机限制；Cluster 解决"高可用 + 数据分片/水平扩展"。数据量大、要扩节点选 Cluster；数据量小、只要故障转移选哨兵即可。
