---
title: Kafka 深度解析：分区、副本、消费组与消息可靠性
category: java
level: advanced
readMinutes: 24
tags: "Kafka, 分区, 消费组, 幂等, 顺序"
summary: 剖析 Kafka 架构、分区策略、不重复不丢失与顺序消费。
order: 41
prereq: java/java-mq-overview
---

## 一、整体架构

Kafka 集群由若干 **Broker**（服务节点）组成，配合 **Zookeeper**（老版本）或 **KRaft**（新版本，自 2.8 起逐步替代 ZK 做元数据与选主）管理集群状态。核心角色：

-   **Producer**：消息生产者，将记录发送到指定 Topic 的 Partition。
-   **Broker**：存储 Partition 副本、响应读写请求的服务进程。
-   **Consumer**：消费者，从 Partition 拉取消息。
-   **Consumer Group**：多个 Consumer 组成一个组，共同消费一个 Topic，实现水平扩展与负载均衡。

一个 Topic 被切分为多个 Partition，每个 Partition 是一个有序、不可变的消息日志，消息以 offset 标识位置。Partition 可配置多个副本（Replica）实现高可用。

## 二、Topic、Partition、Offset 与副本

-   **Partition（分区）**：并发与并行的基本单位。分区数决定了最大消费并行度（一个分区同一时刻只能被组内一个消费者持有）。分区越多，写入吞吐越高，但也会增加副本同步开销和文件句柄。
-   **Offset**：分区内每条消息的唯一递增序号，是消费者的消费进度指针。
-   **Replica（副本）**：每个 Partition 有多个副本，分布在不同的 Broker 上。其中：
    -   **Leader**：负责处理该分区所有读写请求。
    -   **Follower**：从 Leader 异步拉取数据保持同步。
    -   **ISR（In-Sync Replicas）**：与 Leader 保持同步的副本集合（含 Leader）。只有 ISR 中的副本才有资格被选举为新 Leader。acks=all 时，需等待 ISR 全部确认才算写入成功。

当 Leader 宕机，Controller 会从 ISR 中选举新的 Leader，保证不丢已提交的消息。

## 三、生产者可靠性

生产者侧要权衡吞吐与可靠性，关键参数：

-   **acks**：
    -   `acks=0`：发完就当成功，不等待任何确认，可能丢消息，但最快。
    -   `acks=1`：Leader 写入成功即返回，Leader 宕机且未同步到 Follower 会丢消息（默认）。
    -   `acks=all`（或 -1）：需 ISR 中所有副本都确认，最可靠，吞吐略降。
-   **retries**：发送失败自动重试次数，配合 `retry.backoff.ms` 退避，避免瞬时抖动丢消息。
-   **enable.idempotence=true（幂等）**：Producer 分配 PID，每条消息带序列号，Broker 去重，保证单分区内不重复。幂等是单向的，且仅针对单分区单会话。
-   **事务（Exactly-Once）**：通过 `transactional.id` + `initTransactions/sendOffsetsToTransaction/commitTransaction`，可实现“消费-转换-生产”跨分区的原子写入，做到端到端精确一次语义。

下面是一段带回调、开启幂等、acks=all 的生产者示例：

```java
Properties props = new Properties();
props.put("bootstrap.servers", "localhost:9092");
props.put("key.serializer", "org.apache.kafka.common.serialization.StringSerializer");
props.put("value.serializer", "org.apache.kafka.common.serialization.StringSerializer");
props.put("acks", "all");                 // 所有 ISR 副本确认
props.put("retries", 3);                  // 失败重试
props.put("enable.idempotence", "true");  // 开启幂等，防止乱序与重复

KafkaProducer<String, String> producer = new KafkaProducer<>(props);

ProducerRecord<String, String> record =
        new ProducerRecord<>("order-topic", "order-1001", "paid");

// 异步发送，带回调处理成功/失败
producer.send(record, (metadata, exception) -> {
    if (exception == null) {
        // 发送成功，拿到分区与 offset
        System.out.println("发送成功 -> topic=" + metadata.topic()
                + " partition=" + metadata.partition()
                + " offset=" + metadata.offset());
    } else {
        // 发送失败，这里可做告警或落本地补偿表
        System.err.println("发送失败: " + exception.getMessage());
    }
});

producer.close();
```

## 四、消费组与再均衡

消费者通过 `group.id` 加入消费组。Kafka 按分区把 Topic 的所有 Partition 分配给组内消费者（Range 或 RoundRobin 等策略），实现负载均衡：分区数 > 消费者数时，一个消费者可能负责多个分区；消费者数 > 分区数时，多余的消费者空闲。

**再均衡（Rebalance）**：当消费者加入、退出、或心跳超时，组协调器触发再均衡，重新分配分区。再均衡期间消费暂停，且可能导致重复消费（旧持有者已处理但未提交 offset，新持有者从已提交位置重新消费）。频繁再均衡会严重影响吞吐，应合理设置 `session.timeout.ms` 与 `heartbeat.interval.ms`，并避免长时间处理阻塞心跳。

## 五、Offset 提交与防丢失/重复

-   **自动提交**：`enable.auto.commit=true`，每隔 `auto.commit.interval.ms` 自动提交最新 offset。简单但可能在“已消费但未提交”时崩溃，导致丢消息；或“已提交但未处理完”时崩溃，导致重复消费。
-   **手动提交（推荐）**：`enable.auto.commit=false`，在业务逻辑处理成功后再提交，保证至少处理一次（At-Least-Once）。

下面是一段手动同步提交 offset 的消费者示例，先处理业务、再提交，避免消息丢失：

```java
Properties props = new Properties();
props.put("bootstrap.servers", "localhost:9092");
props.put("group.id", "order-group");
props.put("key.deserializer", "org.apache.kafka.common.serialization.StringDeserializer");
props.put("value.deserializer", "org.apache.kafka.common.serialization.StringDeserializer");
props.put("enable.auto.commit", "false"); // 关闭自动提交

KafkaConsumer<String, String> consumer = new KafkaConsumer<>(props);
consumer.subscribe(Collections.singletonList("order-topic"));

while (true) {
    ConsumerRecords<String, String> records = consumer.poll(Duration.ofMillis(1000));
    for (ConsumerRecord<String, String> r : records) {
        // 1) 先处理业务（扣库存、发通知等）
        processOrder(r.value());
    }
    // 2) 业务全部处理成功后再同步提交 offset
    //    若此处之前崩溃，则重启会从旧 offset 重新消费 -> 至少一次语义
    consumer.commitSync();
}

// 注意：手动提交 + 业务处理，必须保证 processOrder 幂等，否则重复消费会出问题。
```

## 六、顺序消费

Kafka 只保证**分区内有序**。要让某类消息严格有序，需让它们落到同一个分区。做法是使用相同业务 key（如用户 ID、订单 ID）作为消息 key，Kafka 默认按 key 的哈希取模分配到分区：

```java
// 相同 orderId 的消息一定进入同一分区，从而保证该订单的消息顺序
ProducerRecord<String, String> record =
        new ProducerRecord<>("order-topic", orderId, orderEventJson);
producer.send(record);
```

若业务还要求“全局唯一顺序”，则只能把 Topic 设为单分区（牺牲并行度），实际很少需要。

## 七、重复消费与消息丢失排查

**重复消费常见原因**：

-   手动提交前崩溃，重启后从旧 offset 重放。
-   再均衡导致分区被重新分配。
-   处理超时触发 max.poll.interval.ms 踢出组。

**对策**：消费端做幂等（唯一键去重表、Redis SETNX、数据库唯一索引）。

**消息丢失常见原因**：

-   生产者 acks=0/1 且 Leader 宕机。
-   消费者自动提交，处理前就提交 offset，崩溃后丢消息。
-   unclean.leader.election.enable=true 允许非 ISR 副本当选 Leader，造成已提交消息丢失（生产应设为 false）。

## 实际开发中的应用

-   **订单状态流转**：同一订单 ID 作为 key 进同一分区，保证“创建→支付→发货”事件顺序被正确处理。
-   **消费幂等**：在数据库建 `msg_id` 唯一索引，消费前先 INSERT，重复则忽略，配合手动提交实现“不丢不重”。
-   **监控**：关注 `records-lag-max`（消费滞后）、`under-replicated-partitions`（副本不足）等指标，滞后持续增大说明消费跟不上，需扩容分区或消费者。

**常见坑**：

-   把 `auto.commit` 开着又想精确处理，结果丢消息。
-   消费者里做耗时 IO 不提交，触发再均衡雪崩。
-   分区数定小了后期无法平滑提升消费并行度（增分区可，但 key 哈希会变，需评估）。
