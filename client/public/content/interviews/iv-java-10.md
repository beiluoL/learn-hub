---
question: 消息队列如何保证消息不丢失？如何避免重复消费？
category: java
difficulty: hard
tags: "MQ, 消息可靠性, 幂等, Kafka, RabbitMQ"
order: 24
---

## 核心结论

**回答**：消息不丢失需要覆盖消息生命周期三阶段——生产端用 confirm/重试、Broker 端用多副本同步刷盘、消费端用手动 ack 保证处理完毕才确认。重复消费是分布式系统的固有特征（"至少一次"语义），无法完全避免，必须通过幂等设计处理。MQ 领域的核心权衡是"可靠性 vs 吞吐量"，每提升一个可靠性等级都有性能代价。

## 消息不丢失：三阶段保障

```
生产者 → [Broker] → 消费者
  ①确认      ②持久化      ③手动确认
```

### 阶段一：生产端（发送确认）

#### Kafka 生产者配置

```java
Properties props = new Properties();
// acks=all（-1）：所有 ISR 副本确认后才算发送成功
props.put(ProducerConfig.ACKS_CONFIG, "all");
// 开启幂等性：避免网络重试导致消息重复
props.put(ProducerConfig.ENABLE_IDEMPOTENCE_CONFIG, true);
// 重试次数
props.put(ProducerConfig.RETRIES_CONFIG, Integer.MAX_VALUE);
// inflight 请求数设为 1（幂等性要求 ≤5）
props.put(ProducerConfig.MAX_IN_FLIGHT_REQUESTS_PER_CONNECTION, 5);

KafkaProducer<String, String> producer = new KafkaProducer<>(props);
producer.send(record, (metadata, exception) -> {
    if (exception != null) {
        // 发送失败处理：记录到本地 DB、重试队列或死信队列
        log.error("消息发送失败: {}", exception.getMessage());
    }
});
```

#### RabbitMQ 生产者确认

```java
// 开启 publisher confirm 模式
rabbitTemplate.setConfirmCallback((correlationData, ack, cause) -> {
    if (!ack) {
        // 发送失败：记录并重试
        log.warn("消息发送失败: {}", cause);
        retrySend(correlationData);
    }
});

// 消息设置持久化
MessageProperties props = new MessageProperties();
props.setDeliveryMode(MessageDeliveryMode.PERSISTENT);
```

### 阶段二：Broker 端（持久化复制）

| 机制 | Kafka | RabbitMQ |
|------|-------|----------|
| 分区副本 | `replication.factor=3`（至少 3 副本） | Mirrored Queue / Quorum Queue |
| ISR | `min.insync.replicas=2`（最少同步副本数） | 不适用 |
| 刷盘策略 | OS 异步刷盘 + 页缓存（可配同步刷盘但性能差） | 持久队列 + 消息持久化 |
| 未同步副本 | `unclean.leader.election.enable=false`（禁止落后副本当选） | 不适用 |

Kafka 关键配置组合：

```properties
# 副本数：每个分区的总副本数
replication.factor=3
# ISR 最小数量：必须至少 2 个副本同步才算写入成功
min.insync.replicas=2
# unclean 选举：false 禁止非 ISR 副本被选为 Leader
unclean.leader.election.enable=false
```

**为什么 acks=all + min.insync.replicas=2 不丢失？** 当分区 Leader 宕机时，ISR 中至少有一个 Follower 包含了所有已确认的消息。新 Leader 从 ISR 中选举，消息完整保留。

### 阶段三：消费端（手动提交偏移量）

```java
// Kafka：手动提交 offset
@KafkaListener(topics = "order-topic")
public void onMessage(ConsumerRecord<String, String> record,
                       Acknowledgment ack) {
    try {
        processOrder(record.value());
        // 业务处理成功后手动提交
        ack.acknowledge();
    } catch (Exception e) {
        // 不提交，消息会被重新消费
        log.error("消费失败: {}", e);
    }
}

// Kafka 消费者配置
props.put(ConsumerConfig.ENABLE_AUTO_COMMIT_CONFIG, false);   // 关闭自动提交
props.put(ConsumerConfig.AUTO_OFFSET_RESET_CONFIG, "earliest"); // 从最早位置消费
```

## 消息重复消费与幂等方案

### 重复消费的原因

```
场景一：生产者重试
Producer 发送成功但 Broker ACK 丢失 → Producer 重试 → Broker 重复写入

场景二：消费者 rebalance
Consumer 处理完消息但 offset 未提交 → Rebalance → 新 Consumer 重新消费

场景三：手动提交失败
业务逻辑成功但 ack.acknowledge() 超时 → 触发 rebalance → 重复消费
```

### 幂等方案比较

#### 方案一：数据库唯一索引（最常用）

```java
@Transactional
public void processOrder(OrderMessage msg) {
    // 利用数据库唯一约束保证幂等
    // INSERT IGNORE 或 ON DUPLICATE KEY UPDATE
    int result = jdbcTemplate.update(
        "INSERT IGNORE INTO order_consume_log (msg_id, status, create_time) VALUES (?, ?, ?)",
        msg.getId(), "PROCESSING", new Date()
    );
    if (result > 0) {
        // 首次消费，执行业务逻辑
        doBusinessLogic(msg);
    }
    // result == 0 表示已消费过，跳过
}
```

#### 方案二：Redis SET NX（分布式幂等）

```java
public boolean processWithRedis(String msgId, Runnable businessLogic) {
    String lockKey = "msg:consumed:" + msgId;
    // SET key value NX EX 60：原子操作，存在则失败
    Boolean acquired = redisTemplate.opsForValue()
        .setIfAbsent(lockKey, "1", 60, TimeUnit.MINUTES);
    if (Boolean.TRUE.equals(acquired)) {
        businessLogic.run();
        return true;
    }
    return false; // 已处理过
}
```

#### 方案三：业务状态机

```java
public void processOrder(OrderMessage msg) {
    Order order = orderDao.findById(msg.getOrderId());
    // 状态机驱动的幂等
    if (order.getStatus() == OrderStatus.PAID) {
        return; // 已支付，跳过
    }
    if (order.getStatus() == OrderStatus.CREATED) {
        // CAS 更新：WHERE status = CREATED
        int rows = orderDao.updateStatus(order.getId(), OrderStatus.CREATED, OrderStatus.PAID);
        if (rows > 0) {
            inventoryService.deduct(msg.getProductId(), msg.getQuantity());
        }
    }
}
```

### 三种方案对比

| 方案 | 优点 | 缺点 | 适用场景 |
|------|------|------|----------|
| DB 唯一索引 | 强一致，与业务事务同事务 | 写入 DB 有性能开销 | 有数据库的场景 |
| Redis SETNX | 高性能，毫秒级 | Redis 故障时可能重复 | 高吞吐场景 |
| 业务状态机 | 无额外存储 | 业务复杂时状态多 | 有明确状态流转的业务 |

## 面试追问

1. **Kafka 如何保证分区内消息有序？** 单分区内消息顺序写入、顺序消费。多分区无法保证全局有序。若需全局有序：将所有消息发送到同一个分区（指定相同 key），或使用单分区 Topic。

2. **消息积压如何解决？** 紧急扩容：临时增加消费者数量、增加分区数。长期方案：消息队列监控告警、消费逻辑异步批量化、必要时降级非核心消费。

3. **RabbitMQ 的镜像队列 vs 仲裁队列（Quorum Queue）**：镜像队列全量复制到所有镜像节点，单节点慢则全慢。仲裁队列基于 Raft 协议，少数服从多数，性能更好，RabbitMQ 3.8+ 推荐。

4. **死信队列（DLQ）有什么用？** 消费反复失败的消息进入 DLQ，避免阻塞队列。通过人工或定时任务处理 DLQ 中的消息，形成闭环兜底机制。
