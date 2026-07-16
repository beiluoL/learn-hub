---
question: Redis 缓存穿透、缓存击穿、缓存雪崩分别是什么？如何解决？
category: java
difficulty: middle
tags: "Redis, 缓存穿透, 缓存击穿, 缓存雪崩"
order: 23
---

## 核心结论

**回答**：缓存三大问题本质是请求绕过/打穿 Redis 直接冲击数据库。穿透是查不存在的数据（缓存和 DB 都没有），击穿是热点 key 过期瞬间大量并发打到 DB，雪崩是大面积 key 同时过期或 Redis 宕机。穿透用布隆过滤器或缓存空值，击穿用互斥锁或逻辑过期，雪崩用随机 TTL + 多级缓存 + 高可用架构。

## 三者区别

| 维度 | 缓存穿透 | 缓存击穿 | 缓存雪崩 |
|------|----------|----------|----------|
| 发生条件 | 查询不存在的数据 | 热点 key 过期 | 大量 key 同时过期 / Redis 宕机 |
| 缓存状态 | 始终为空 | 缓存过期的瞬间 | 大面积失效 |
| 冲击目标 | 同一无效 key 反复访问 | 单个热点 key 并发访问 | 全库各类查询 |
| 典型场景 | 恶意攻击/爬虫遍历 | 秒杀商品缓存到期 | 批量缓存预热后同时过期 |

## 缓存穿透解决方案

### 方案一：布隆过滤器

布隆过滤器的核心是"不存在的 key 一定不存在，存在的 key 可能存在（有误判率）"。

```java
@Configuration
public class BloomFilterConfig {
    @Bean
    public RBloomFilter<String> userBloomFilter(RedissonClient redisson) {
        RBloomFilter<String> bloomFilter = redisson.getBloomFilter("user_bloom");
        // 预计 100 万条数据，误判率 1%
        bloomFilter.tryInit(1_000_000L, 0.01);
        return bloomFilter;
    }
}

@Service
public class UserService {
    @Autowired
    private RBloomFilter<String> bloomFilter;
    @Autowired
    private RedisTemplate<String, Object> redisTemplate;

    public User getUserById(Long id) {
        String key = "user:" + id;
        // 第一步：布隆过滤器拦截
        if (!bloomFilter.contains(key)) {
            return null; // 确定不存在，直接返回
        }
        // 第二步：查缓存
        User user = (User) redisTemplate.opsForValue().get(key);
        if (user != null) return user;
        // 第三步：查数据库
        user = userDao.findById(id);
        if (user != null) {
            redisTemplate.opsForValue().set(key, user, 30, TimeUnit.MINUTES);
        }
        return user;
    }
}
```

布隆过滤器的误判率与空间、哈希函数数量的权衡：

| 元素数量 | 期望误判率 | 所需内存 | 哈希函数数 |
|----------|------------|----------|------------|
| 100万 | 1% | ~1.2 MB | 7 |
| 100万 | 0.1% | ~1.8 MB | 10 |
| 1000万 | 1% | ~12 MB | 7 |

### 方案二：缓存空值

```java
User user = userDao.findById(id);
if (user == null) {
    // 缓存空对象，设置较短过期时间防止占用过多空间
    redisTemplate.opsForValue().set(key, new NullUser(), 5, TimeUnit.MINUTES);
    return null;
}
```

**注意**：空值缓存有效期要短（2~5 分钟），防止正常数据写入后缓存还返回 null。

## 缓存击穿解决方案

### 方案一：互斥锁（Mutex）

```java
public User getByMutex(Long id) {
    String key = "user:" + id;
    User user = (User) redisTemplate.opsForValue().get(key);
    if (user != null) return user;

    // 缓存未命中，加锁重建
    String lockKey = "lock:user:" + id;
    try {
        boolean locked = redisTemplate.opsForValue()
            .setIfAbsent(lockKey, "1", 10, TimeUnit.SECONDS);
        if (locked) {
            // Double Check：再次检查缓存
            user = (User) redisTemplate.opsForValue().get(key);
            if (user != null) return user;
            // 查询数据库
            user = userDao.findById(id);
            redisTemplate.opsForValue().set(key, user, 30, TimeUnit.MINUTES);
        } else {
            // 没抢到锁，等待后重试
            Thread.sleep(50);
            return getByMutex(id); // 递归重试
        }
    } finally {
        redisTemplate.delete(lockKey);
    }
    return user;
}
```

### 方案二：逻辑过期（不设置 TTL）

```java
// 缓存值包装类
class CacheWrapper<T> {
    T data;
    long expireTime; // 逻辑过期时间戳
}

public User getByLogicalExpire(Long id) {
    String key = "user:" + id;
    CacheWrapper<User> wrapper = (CacheWrapper<User>) redisTemplate.opsForValue().get(key);

    if (wrapper == null) return null;

    // 逻辑未过期，直接返回
    if (System.currentTimeMillis() < wrapper.expireTime) {
        return wrapper.data;
    }

    // 逻辑已过期，异步重建
    asyncRebuildCache(id);
    return wrapper.data; // 返回旧值，避免阻塞
}
```

**互斥锁 vs 逻辑过期对比**：

| 方案 | 一致性 | 性能 | 复杂度 | 适用场景 |
|------|--------|------|--------|----------|
| 互斥锁 | 强一致 | 有锁等待 | 中 | 一致性要求高 |
| 逻辑过期 | 最终一致 | 无阻塞 | 高 | 高并发、可接受短暂不一致 |

## 缓存雪崩解决方案

### 组合策略

```java
// 1. 随机 TTL：基础过期时间 + 随机偏移
int ttl = 30 * 60 + new Random().nextInt(10 * 60); // 30分钟 + 0~10分钟随机
redisTemplate.opsForValue().set(key, value, ttl, TimeUnit.SECONDS);

// 2. 多级缓存：本地 Caffeine + Redis
Cache<String, Object> localCache = Caffeine.newBuilder()
    .maximumSize(10000)
    .expireAfterWrite(5, TimeUnit.MINUTES)
    .build();

public User getMultiLevel(Long id) {
    String key = "user:" + id;
    // L1: 本地缓存
    User user = (User) localCache.getIfPresent(key);
    if (user != null) return user;
    // L2: Redis
    user = (User) redisTemplate.opsForValue().get(key);
    if (user != null) {
        localCache.put(key, user);
        return user;
    }
    // L3: 数据库
    user = userDao.findById(id);
    if (user != null) {
        redisTemplate.opsForValue().set(key, user, ttl, TimeUnit.SECONDS);
        localCache.put(key, user);
    }
    return user;
}
```

### 高可用架构层面

- **Redis 主从 + 哨兵**：主节点故障时自动故障转移
- **Redis Cluster**：数据分片，单节点故障仅影响部分 key
- **限流降级**：在 Nginx 或网关层做限流，一旦 DB 负载过高触发降级返回默认数据
- **永不过期**：核心热点 key 通过后台定时任务刷新，不设置 TTL

## 面试追问

1. **布隆过滤器无法删除元素，如何解决？** 使用 Counting Bloom Filter（计数器布隆过滤器），每个位置从 bit 改成 counter，支持删除但空间开销增大约 4 倍。或用 Cuckoo Filter 替代。

2. **缓存预热怎么做？** 系统启动时从数据库加载热点数据到缓存。可用 @PostConstruct + 线程池异步加载，或搭建独立预热服务，支持手动/定时触发。

3. **如何保证缓存与数据库双写一致性？** 一般用"先更新数据库，再删除缓存"（Cache Aside）模式，配合延迟双删 + MQ 重试补偿。强一致场景用 Canal 监听 binlog 异步更新缓存。

4. **热点 key 发现和重建有哪些工具？** JD 的 hotkey 探测框架、阿里 Sentinel 热点参数限流、自建热点统计（滑动窗口 + 频次计数），探测到热点后主动预热到所有 Redis 节点。
