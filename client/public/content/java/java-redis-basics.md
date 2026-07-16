---
title: Redis 数据类型与底层结构：String/Hash/List/Set/ZSet
category: java
level: beginner
readMinutes: 18
order: 54
tags: "Redis, 数据类型, 应用场景, 底层"
summary: 讲解五种数据类型、底层编码与典型业务场景。
prereq: java/java-basics
---

## Redis 五种数据类型概览

Redis 是键值数据库，键（key）永远是字符串，而**值（value）** 有多种类型。掌握每种类型的特性和适用场景，是用好 Redis 的基础。

| 数据类型 | 中文名 | 典型场景 |
| --- | --- | --- |
| String | 字符串 | 计数器、缓存、分布式锁 |
| Hash | 哈希 | 对象存储、购物车 |
| List | 列表 | 消息队列、最新列表 |
| Set | 集合 | 点赞、共同好友、去重 |
| ZSet（Sorted Set） | 有序集合 | 排行榜、延时队列 |

## String：最基础的类型

**String 是二进制安全的**，可以存文本、数字甚至序列化后的对象，最大 512MB。底层采用 **SDS（Simple Dynamic String）** 结构，相比 C 字符串能 O(1) 获取长度、杜绝缓冲区溢出。

底层编码有三类：
- **int**：值是整数且可以用 long 表示。
- **embstr**：短字符串（≤44 字节），内存连续分配，效率高。
- **raw**：长字符串（>44 字节）。

常用命令：`SET`、`GET`、`INCR`（原子自增，适合计数器）、`SETNX`（不存在才设置，分布式锁基础）。

**应用场景**：接口限流计数器、缓存用户信息、分布式锁。

## Hash：键值对的集合

Hash 适合存储**对象**，如一个用户有多个字段（name、age、email）。底层在元素少、体积小的时候用 **ziplist（紧凑列表）**，元素变多后转成 **hashtable**，兼顾内存和性能。

常用命令：`HSET`、`HGET`、`HGETALL`、`HINCRBY`。

**应用场景**：购物车（key=用户 id，field=商品 id，value=数量）；用户资料对象。

## List：有序可重复的列表

List 底层在 Redis 3.2 之后统一为 **quicklist**（ziplist 的双向链表），兼顾连续内存的省空间和链表的易增删。它是有序、可重复的，支持两端插入弹出。

常用命令：`LPUSH`/`RPUSH`、`LPOP`/`RPOP`、`LRANGE`（范围获取，可做分页）。

**应用场景**：消息队列（LPUSH 生产、RPOP 消费，但无 ack 机制，严肃场景用 Stream）；最新 N 条动态（LPUSH + LTRIM 保留前 100 条）。

## Set：无序不重复集合

Set 底层在小且都是整数时用 **intset**，否则用 **hashtable**（value 为 NULL）。它自动去重，并支持交集、并集、差集。

常用命令：`SADD`、`SISMEMBER`、`SINTER`（交集）、`SCARD`（计数）。

**应用场景**：点赞（用户 id 加入集合去重）、共同好友（两人好友集合取交集）、抽奖去重。

## ZSet：带分数的有序集合

ZSet 每个成员关联一个 **score（分数）**，按分数排序，且成员唯一。底层是 **跳表（skiplist）+ dict** 的组合：跳表保证按分数有序、范围查询快；dict 保证按 member 查分数 O(1)。

常用命令：`ZADD`、`ZRANGE`（按分数升序）、`ZREVRANGE`（降序）、`ZRANK`、`ZSCORE`。

**应用场景**：排行榜（score=积分）；延时队列（score=执行时间戳，定时取到期任务）。

## Java 客户端示例（Jedis / Lettuce）

Redis 的 Java 客户端常用 Jedis（直连、线程不安全需配连接池）和 Lettuce（基于 Netty、线程安全、支持异步）。下面以 Jedis 为例：

```java
import redis.clients.jedis.Jedis;
import redis.clients.jedis.params.SetParams;
import java.util.Set;

public class RedisTypeDemo {
    public static void main(String[] args) {
        try (Jedis jedis = new Jedis("localhost", 6379)) {

            // String：计数器与缓存
            jedis.set("user:1:name", "Tom");
            jedis.incr("article:100:views");          // 阅读量 +1
            System.out.println(jedis.get("user:1:name"));

            // Hash：购物车
            jedis.hset("cart:1", "sku:1001", "2");
            jedis.hincrBy("cart:1", "sku:1001", 1);   // 数量 +1
            System.out.println(jedis.hgetAll("cart:1"));

            // Set：点赞去重
            jedis.sadd("like:article:100", "user:1", "user:2");
            System.out.println(jedis.scard("like:article:100"));

            // ZSet：排行榜
            jedis.zadd("rank:game", 95, "playerA");
            jedis.zadd("rank:game", 88, "playerB");
            Set<String> top = jedis.zrevrange("rank:game", 0, 1); // 前两名
            System.out.println("冠军: " + top);
        }
    }
}
```

使用 Spring Data Redis 时，模板写法如下：

```java
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ZSetOperations;

// 注入 StringRedisTemplate
public void demo(StringRedisTemplate redisTemplate) {
    // 原子自增
    Long views = redisTemplate.opsForValue().increment("article:100:views");
    // 排行榜
    ZSetOperations<String, String> zset = redisTemplate.opsForZSet();
    zset.add("rank:game", "playerA", 95);
    // 取前 3 名（含分数）
    zset.reverseRangeWithScores("rank:game", 0, 2);
}
```

## 选型速查表

- 需要**缓存对象多个字段** → Hash（避免整体序列化大对象）。
- 需要**计数、限流、锁** → String（INCR / SETNX）。
- 需要**队列、最新列表** → List。
- 需要**去重、交集/并集** → Set。
- 需要**排序、排行榜、带权重的集合** → ZSet。

## 实际开发中的应用 / 常见问题

**问题一：大 key 有什么危害？**
某个 value 过大（如一个 Set 上百万成员）就是"大 key"，会导致删除/遍历时阻塞 Redis 单线程，网络传输慢。建议拆分：大 Hash 按字段分片，大 List 分页。

**问题二：为什么 List 做消息队列不推荐？**
List 的 `RPOP` 没有确认机制，消费者崩溃会丢消息；且不支持多消费者分组。严肃业务用 Redis Stream 或 Kafka/RabbitMQ。

**问题三：String 能存对象吗？**
可以，把对象 JSON 序列化后存入（如 `SET user:1 '{...}'`），但更新单个字段要整体读写，不如 Hash 灵活。根据"是否常改局部字段"选择 String 还是 Hash。

**问题四：ZSet 分数相同怎么办？**
分数相同的成员按字典序排序，仍然有序且可重复分数，不影响查询正确性。
