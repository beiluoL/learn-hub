---
title: Redis 缓存经典问题：穿透、击穿、雪崩与一致性
category: java
level: advanced
readMinutes: 22
order: 55
tags: "Redis, 缓存穿透, 击穿, 雪崩, 布隆过滤器"
summary: 剖析三大缓存问题与双写一致性，给出布隆过滤器方案。
prereq: java/java-redis-basics
---

## 缓存与数据库的典型读写流程

最常见的缓存模式是 **Cache Aside（旁路缓存）**：
- **读**：先查缓存，命中直接返回；未命中查数据库，写入缓存再返回。
- **写**：先更新数据库，再删除缓存（不是更新缓存）。

这套流程简单高效，但会引出三个经典问题：穿透、击穿、雪崩。下面逐一剖析。

## 缓存穿透：查不存在的数据

**现象**：请求的数据在数据库中也不存在，所以缓存永远 miss，请求每次都打到数据库。攻击者故意构造大量不存在的 id（如负数、随机串）疯狂请求，数据库被压垮。

**解决方案一：缓存空值**。查库发现不存在时，也在缓存里写个空值（`SET key "" EX 300`），下次同样的请求直接命中空值返回，保护数据库。注意空值要设较短过期时间，避免脏数据长期占用内存。

```java
public String getUserWithNullCache(Long id) {
    String key = "user:" + id;
    String val = redis.get(key);
    if (val != null) {
        return "".equals(val) ? null : val;   // 空值直接返回 null
    }
    User u = userMapper.selectById(id);        // 查库
    if (u == null) {
        redis.setex(key, 300, "");             // 缓存空值，5 分钟
        return null;
    }
    redis.setex(key, 3600, toJson(u));
    return toJson(u);
}
```

**解决方案二：布隆过滤器（Bloom Filter）**。在访问缓存之前，先用布隆过滤器判断 key 是否"可能存在"。它用多个哈希函数把 key 映射到位数组，判断存在可能有误判、判断不存在则一定不存在。所有合法 id 提前写入过滤器，非法 id 直接拦截，根本不会打到缓存和数据库。

布隆过滤器伪代码：

```java
// 初始化：把全量合法 id 写入布隆过滤器
BloomFilter<Long> filter = BloomFilter.create(Funnels.longFunnel(), 10000000, 0.01);
for (Long id : allValidIds) {
    filter.put(id);
}

// 查询时先过过滤器
public User get(Long id) {
    if (!filter.mightContain(id)) {
        return null;   // 一定不存在，直接返回，保护数据库
    }
    // 再走 cache -> db 流程
    return getUserWithNullCache(id);
}
```

## 缓存击穿：热点 key 过期瞬间并发回源

**现象**：某个**热点 key**（如首页爆款商品）突然过期，此时有大量并发请求同时发现缓存 miss，一起回源查数据库，瞬间把数据库冲垮。它和穿透的区别是：击穿查的是**真实存在且高并发**的 key。

**解决方案一：互斥锁（Mutex）**。第一个线程发现 miss 时加分布式锁，只有它去查库并写缓存，其他线程等待或短暂重试，避免集体回源。

```java
public String getHotWithLock(String key) {
    String val = redis.get(key);
    if (val != null) return val;

    // 用 SETNX 抢锁，只有抢到的线程去回源
    String lockKey = "lock:" + key;
    String token = UUID.randomUUID().toString();
    if (redis.set(lockKey, token, "NX", "EX", 30)) {  // 原子加锁
        try {
            val = db.query(key);                 // 回源
            redis.setex(key, 3600, val);         // 写缓存
        } finally {
            // 用 Lua 保证只删自己的锁，防误删
            releaseLock(lockKey, token);
        }
        return val;
    }
    // 没抢到锁：短暂休眠后重试读缓存
    Thread.sleep(50);
    return redis.get(key);
}
```

**解决方案二：逻辑过期**。不为 key 设真实 TTL，而在 value 里存一个逻辑过期时间；发现逻辑过期时，另起线程异步重建缓存，当前请求先返回旧值。这样请求永不阻塞，但需要业务能容忍短暂旧数据。

## 缓存雪崩：大量 key 同时失效或 Redis 宕机

**现象**：大量缓存 key 在同一时刻集中过期（比如初始化时设了相同 TTL），或 Redis 实例宕机，导致请求全部落到数据库，数据库瞬间被打挂，进而整个系统雪崩。

**解决方案**：
- **错开过期时间**：给 TTL 加随机值，如 `EXPIRE key 3600 + random(0, 600)`，避免同时失效。
- **多级缓存**：本地缓存（Caffeine） + Redis，Redis 挂了还有本地兜底。
- **高可用**：Redis 用哨兵或 Cluster 集群，避免单点故障。
- **限流降级**：对数据库做限流，超过阈值返回降级页面，保护核心链路。

```java
// 过期时间 = 基础时间 + 随机抖动，防止集体失效
int ttl = 3600 + new Random().nextInt(600);
redis.setex(key, ttl, value);
```

## 缓存与数据库双写一致性

**Cache Aside 标准做法**：更新数据库后**删除缓存**（不是更新缓存）。因为每次更新缓存，不如等下次读时再重建，避免并发写导致缓存脏数据。

**延迟双删**：极端情况下，读请求在"删缓存"和"更新库"之间穿插可能写回旧值。可先删缓存 → 更新库 → 休眠几百毫秒 → 再删一次缓存，降低残留旧值概率。

```java
public void updateUser(User u) {
    redis.del("user:" + u.getId());     // 1. 删缓存
    userMapper.updateById(u);           // 2. 更新库
    try {
        Thread.sleep(500);              // 3. 休眠，等待读请求造成的脏写完成
    } catch (InterruptedException ignored) {}
    redis.del("user:" + u.getId());     // 4. 再删一次
}
```

**binlog 订阅（最终一致）**：用 Canal 监听 MySQL binlog，把变更异步同步到 Redis，业务代码只管写库，由中间件保证缓存最终一致，解耦且可靠，是大型系统的主流方案。

**数据不一致的场景**：先更新库再删缓存，若删缓存失败，缓存仍是旧值。解决：删除失败重试（消息队列补偿），或走 binlog 订阅保证最终一致。

## 实际开发中的应用 / 常见问题

**问题一：先删缓存还是先更新库？**
推荐"先更新库，再删缓存"。先删缓存再更新库，在并发下更容易出现"删缓存 → 读请求回源旧值入缓存 → 库更新完成"的脏数据；而先更库再删缓存，配合延迟双删或 binlog，能把不一致窗口降到极低。

**问题二：缓存和数据库能强一致吗？**
缓存本质是为了性能牺牲一点一致性，做不到与数据库强一致。要求强一致的核心数据（如余额）应直接读库；其他场景接受"最终一致"即可。

**问题三：布隆过滤器误判怎么办？**
误判意味着"不存在的被判断为可能存在"，此时会继续查缓存和库，但查库也查不到，不影响正确性，只是多一次无害查询。把误判率设低（如 0.01）即可。

**问题四：热点 key 重建慢，锁竞争怎么办？**
互斥锁会让其他线程等待，可用"逻辑过期 + 异步重建"避免阻塞；或提前在后台预热（定时任务在 key 过期前主动重建），从根本上避免击穿。
