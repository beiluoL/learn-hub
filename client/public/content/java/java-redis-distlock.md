---
title: Redis 分布式锁实战：Redisson、看门狗与红锁
category: java
level: advanced
readMinutes: 20
order: 56
tags: "Redis, 分布式锁, Redisson, 红锁"
summary: 手写分布式锁的坑、Redisson 看门狗机制与红锁取舍。
prereq: java/java-redis-basics
---

## 为什么需要分布式锁

在单机应用里，用 `synchronized` 或 `ReentrantLock` 就能保证线程安全。但在**分布式/集群部署**下，多个服务实例运行在不同 JVM 甚至不同机器上，本地锁管不住跨进程的并发。此时需要一把所有实例都能看到的"全局锁"，Redis 分布式锁就是最常用方案——利用 Redis 单线程、命令原子性的特点，把锁实现在一个共享的 key 上。

典型场景：秒杀扣库存、定时任务只在一个节点执行、防止重复下单。

## 用 SETNX 手写锁的坑

最朴素的想法是用 `SETNX key value`（只有不存在才设置）抢锁：

```bash
SETNX lock:order 1      # 返回 1 表示抢到锁
... 执行业务 ...
DEL lock:order          # 释放锁
```

但这套写法有几个致命问题：

1. **死锁**：如果业务执行中异常崩溃，没执行 `DEL`，锁永远不释放，别人永远抢不到。
2. **原子性**：很多人先 `SETNX` 再 `EXPIRE` 过期时间，两步之间崩溃就会死锁。必须用一条原子命令同时设值和过期。
3. **误删他人锁**：锁到期自动释放，但持有者还在执行，此时另一个线程抢到锁；原线程执行完 `DEL` 把**别人的锁**删了。

## 正确姿势：原子加锁 + UUID 防误删

用 `SET key value NX EX` 一条命令完成"不存在才设 + 设过期时间"，保证原子性：

```bash
# value 用唯一标识（如 UUID），EX 设过期时间防止死锁
SET lock:order <uuid> NX EX 30
```

释放锁时必须"判断是当前线程的锁再删"，这一步也要原子，否则判断和删除之间锁可能过期被别人拿走。用 **Lua 脚本**保证原子：

```lua
-- 只有 value 匹配才删除，避免误删别人的锁
if redis.call('get', KEYS[1]) == ARGV[1] then
    return redis.call('del', KEYS[1])
else
    return 0
end
```

Java 手写版：

```java
import redis.clients.jedis.Jedis;
import java.util.UUID;

public class SimpleRedisLock {
    private final Jedis jedis;
    private final String lockKey;

    public SimpleRedisLock(Jedis jedis, String lockKey) {
        this.jedis = jedis;
        this.lockKey = lockKey;
    }

    // 加锁：原子 SET NX EX，value 用 UUID 防误删
    public String tryLock(int expireSeconds) {
        String token = UUID.randomUUID().toString();
        String ok = jedis.set(lockKey, token, "NX", "EX", expireSeconds);
        return "OK".equals(ok) ? token : null;
    }

    // 释放：用 Lua 保证 "判断 + 删除" 原子
    private static final String RELEASE_LUA =
        "if redis.call('get', KEYS[1]) == ARGV[1] then " +
        "  return redis.call('del', KEYS[1]) " +
        "else return 0 end";

    public boolean unlock(String token) {
        Object res = jedis.eval(RELEASE_LUA, 1, lockKey, token);
        return Long.valueOf(1).equals(res);
    }
}
```

## 锁续期：看门狗（Watch Dog）

手写锁有个难题：业务执行时间**超过**锁的过期时间怎么办？锁过期后别的线程抢到，会出现两个线程同时持锁。

解决方案是**锁续期（自动延期）**：加锁的线程启动一个后台定时任务（看门狗），在锁快过期时如果还持有锁，就自动延长过期时间。`Redisson` 客户端内置了这个机制。

## Redisson 实战

Redisson 是对 Redis 的 Java 封装，分布式锁开箱即用，包含看门狗、可重入、自动续期。

```java
import org.redisson.Redisson;
import org.redisson.api.RLock;
import org.redisson.config.Config;

public class RedissonLockDemo {
    public static void main(String[] args) {
        Config config = new Config();
        config.useSingleServer().setAddress("redis://127.0.0.1:6379");
        RedissonClient client = Redisson.create(config);

        RLock lock = client.getLock("lock:order");
        try {
            // 尝试加锁，最多等 10 秒，未指定 leaseTime 则启用看门狗（默认 30s，每 10s 续期）
            boolean locked = lock.tryLock(10, TimeUnit.SECONDS);
            if (locked) {
                try {
                    // 业务逻辑：扣库存、写库等
                    System.out.println("拿到锁，执行中...");
                } finally {
                    lock.unlock();   // 释放锁（内部校验可重入与持有者）
                }
            }
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        } finally {
            client.shutdown();
        }
    }
}
```

Redisson 的看门狗默认锁 30 秒过期，启动后每隔 `30/3 = 10` 秒检查一次，如果业务还没执行完就自动把过期时间重置回 30 秒，直到 `unlock`。如果你显式传入 `leaseTime`，看门狗则关闭，锁按你给的时间到期（需确保业务能在其内完成）。

**可重入**：Redisson 锁用 Hash 结构记录 `锁名 -> {线程标识: 重入次数}`，同一线程重复加锁只是次数 +1，`unlock` 对应减 1，减到 0 才真正释放。

## 红锁（RedLock）与争议

**RedLock** 是 Redis 作者提出的多节点加锁算法：向 N 个（通常 5 个）独立 Redis 主节点申请锁，只要多数（≥ N/2+1）节点加锁成功且总耗时小于锁有效期，就认为拿到锁。目的是避免单点 Redis 故障导致锁失效。

**争议**：分布式系统专家 Martin Kleppmann 指出，RedLock 依赖"各节点时钟大致同步"的假设，而分布式系统无法保证时钟稳定（如 GC 停顿、时钟跳变）会导致锁安全性被破坏。他认为锁应建立在"带 fencing token 的存储"或 ZooKeeper 这类带一致性保证的系统上，而非纯 AP 的 Redis。

**取舍建议**：绝大多数业务用单 Redis + 看门狗已足够（锁失效概率极低）；对正确性要求极高（如金融核心）的场景，应评估是否真的需要 Redis 红锁，或改用 ZooKeeper/etcd 的 CP 锁，并配合业务幂等兜底。

## 实际开发中的应用 / 常见问题

**问题一：锁到期了业务还没跑完？**
用 Redisson 看门狗自动续期；若手写锁，启动后台定时 `EXPIRE` 续期线程，但务必在 `unlock` 时取消续期，否则锁被别人拿走后还在续期。

**问题二：为什么释放锁要 Lua？**
"判断 value 是否属于自己"和"删除"两步若非原子，中间锁可能过期被他人获取，随后误删他人锁。Lua 在 Redis 中原子执行，杜绝该问题。

**问题三：锁粒度怎么定？**
锁的范围越小越好：不要锁整个方法，而是锁具体资源（如 `lock:order:{orderId}`），不同订单互不阻塞，提升并发。

**问题四：分布式锁能完全替代数据库事务吗？**
不能。锁解决"并发执行顺序"，事务解决"数据一致性"。两者配合：锁保证同一资源串行进入，事务保证进入后的操作 ACID。
