---
question: 分布式锁有哪几种实现方式？Redisson 如何实现自动续期？
category: java
difficulty: hard
tags: "分布式锁, Redisson, Redis, Zookeeper, 红锁"
order: 25
---

## 核心结论

**回答**：分布式锁有三种主流实现——数据库（基于唯一索引，最简单但性能差）、Redis（SET NX EX 原子命令，性能最高但存在脑裂风险）、ZooKeeper（临时顺序节点 + 监听机制，强一致但性能较低）。Redisson 的看门狗（Watch Dog）通过后台定时任务自动续期解决了"业务执行时间超过锁过期时间"的问题，是生产环境最推荐的方案。

## 三种分布式锁实现对比

| 维度 | 数据库 | Redis | ZooKeeper |
|------|--------|-------|-----------|
| 实现原理 | INSERT 唯一约束 | SET NX EX + Lua | 临时顺序节点 + Watch |
| 性能 | 低（磁盘 IO） | 高（内存操作） | 中（内存 + Raft/ZAB） |
| 可靠性 | 中（主从切换可能丢锁） | 中（主从异步复制可能丢） | 高（CP 强一致） |
| 阻塞锁 | 需自旋轮询 | Pub/Sub 或自旋 | Watch 回调 |
| 实现复杂度 | 简单 | 中等 | 复杂 |
| 客户端 | 无标准客户端 | Redisson / Jedis | Curator |

## Redis 分布式锁的演进

### 第一代：SETNX + DEL（错误示范）

```java
// 错误：非原子操作
public void wrongLock() {
    Boolean locked = redisTemplate.opsForValue().setIfAbsent("lock", "1");
    if (locked) {
        redisTemplate.expire("lock", 30, TimeUnit.SECONDS); // 可能宕机导致死锁
        doBusiness();
        redisTemplate.delete("lock");
    }
}
```
问题：setIfAbsent 和 expire 之间宕机 → 死锁。

### 第二代：SET NX EX 原子命令

```java
// 正确：原子设置锁 + 过期时间
public boolean tryLock(String key, String value, long expireSeconds) {
    Boolean result = redisTemplate.opsForValue()
        .setIfAbsent(key, value, expireSeconds, TimeUnit.SECONDS);
    return Boolean.TRUE.equals(result);
}
```

### 第三代：Lua 脚本原子释放

```java
// 锁释放必须用 Lua 保证原子性（判断 value 和删除是两步）
private static final String UNLOCK_SCRIPT =
    "if redis.call('get', KEYS[1]) == ARGV[1] then " +
    "   return redis.call('del', KEYS[1]) " +
    "else " +
    "   return 0 " +
    "end";

public boolean unlock(String key, String value) {
    DefaultRedisScript<Long> script = new DefaultRedisScript<>();
    script.setScriptText(UNLOCK_SCRIPT);
    script.setResultType(Long.class);
    Long result = redisTemplate.execute(script, List.of(key), value);
    return result == 1;
}
```

**为什么需要校验 value 再删除？** 防止误删其他线程的锁。如果线程 A 的锁过期了，线程 B 获取了新锁，A 释放时会删掉 B 的锁。通过 value = UUID+线程ID 识别，只删除自己持有的锁。

## Redisson 可重入锁与看门狗原理

### 手写可重入锁（理解原理）

Redisson 使用 Redis Hash 来实现可重入锁：

```
数据结构：
Key: "myLock"
Field: "UUID:线程ID"    → 锁持有者标识
Value: 1                → 重入计数（每次 lock 加 1，unlock 减 1）
```

```java
// 加锁的 Lua 脚本（Redisson 核心逻辑简化版）
String LOCK_SCRIPT =
    // KEY[1] = 锁名称, ARGV[1] = 过期时间(ms), ARGV[2] = UUID:线程ID
    "if (redis.call('exists', KEYS[1]) == 0) then " +
    "   redis.call('hincrby', KEYS[1], ARGV[2], 1); " +  // 首次加锁，重入计数=1
    "   redis.call('pexpire', KEYS[1], ARGV[1]); " +
    "   return nil; " +
    "end; " +
    "if (redis.call('hexists', KEYS[1], ARGV[2]) == 1) then " +
    "   redis.call('hincrby', KEYS[1], ARGV[2], 1); " +  // 重入，计数+1
    "   redis.call('pexpire', KEYS[1], ARGV[1]); " +
    "   return nil; " +
    "end; " +
    "return redis.call('pttl', KEYS[1]);";  // 锁被其他线程持有，返回剩余时间
```

### 看门狗（Watch Dog）自动续期

看门狗的核心：只要锁未被显式释放且客户端存活，每间隔 `过期时间/3` 自动续期。

```java
// RedissonLock 续期逻辑简化
public class RedissonLock {
    // 默认锁过期时间 30 秒
    private long internalLockLeaseTime = 30000;

    private void scheduleExpirationRenewal(long threadId) {
        Timeout task = commandExecutor.getConnectionManager().newTimeout(timeout -> {
            // 续期 Lua 脚本
            String RENEW_SCRIPT =
                "if (redis.call('hexists', KEYS[1], ARGV[2]) == 1) then " +
                "   redis.call('pexpire', KEYS[1], ARGV[1]); " +
                "   return 1; " +
                "end; " +
                "return 0;";

            Long result = eval(RENEW_SCRIPT, key, internalLockLeaseTime, lockName);
            if (result == 1) {
                // 续期成功，10 秒后（30s / 3）再次续期
                scheduleExpirationRenewal(threadId);
            }
            // result == 0 表示锁已不存在，停止续期
        }, internalLockLeaseTime / 3, TimeUnit.MILLISECONDS);
    }
}
```

### Redisson 使用示例

```java
@Service
public class InventoryService {
    @Autowired
    private RedissonClient redisson;

    public void deduct(String productId, int quantity) {
        RLock lock = redisson.getLock("lock:inventory:" + productId);
        try {
            // tryLock 默认不设置过期时间 → 启用看门狗（默认30s，自动续期）
            // 也可手动指定超时：lock.tryLock(10, 30, TimeUnit.SECONDS)
            if (lock.tryLock(10, TimeUnit.SECONDS)) {
                // 业务逻辑：查库存 → 扣减
                int stock = getStock(productId);
                if (stock >= quantity) {
                    deductStock(productId, quantity);
                }
            }
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        } finally {
            // 确保释放的是自己的锁
            if (lock.isHeldByCurrentThread()) {
                lock.unlock();
            }
        }
    }
}
```

## RedLock 红锁与争议

**RedLock 原理**：在 N 个独立的 Redis 节点（Master，非集群）上用相同的 key 加锁，成功 N/2+1 个即视为加锁成功。

**争议**：Martin Kleppmann（剑桥大学）质疑 RedLock 无法提供真正的安全性，因为 Redis 使用异步复制且依赖系统时钟，时钟跳跃可能导致锁泄漏。Antirez（Redis 作者）回应称 RedLock 在工程实践中足够安全。

**实际建议**：大多数场景使用 Redisson 单实例 + 哨兵即可满足需求。对一致性要求极高的场景建议用 ZooKeeper 或 Etcd。

## 面试追问

1. **分布式锁的过期时间怎么设？** 根据业务平均执行时间的 2~3 倍设定。推荐使用自动续期（如 Redisson 看门狗），避免业务还未执行完锁就过期。

2. **ZooKeeper 如何实现分布式锁？** Curator 框架通过创建临时顺序节点实现。所有客户端在同一个路径下创建临时顺序节点，序号最小的获得锁，其他客户端 watch 前一个节点，前一个节点删除后自动唤醒竞争。

3. **锁误删问题除了 UUID 校验还有什么方案？** 本质上都是"持有者标识+释放校验"。Redisson 用 UUID:线程ID，也可以用 RequestId、TraceId。核心是：释放锁时 check-hold-owner → delete，两步必须原子（Lua 脚本）。

4. **Redis Cluster 下分布式锁有什么坑？** 主从切换时可能丢锁。Master 挂了后异步复制的锁数据丢失，Slave 升级成 Master 后其他客户端可以再次获取同一把锁。建议：对一致性要求高的场景用 RedLock 或 ZooKeeper。
