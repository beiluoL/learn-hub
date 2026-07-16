---
title: 消息中间件选型：Kafka 与 RabbitMQ 对比与适用场景
category: java
level: intermediate
readMinutes: 18
tags: "消息队列, Kafka, RabbitMQ, 选型"
summary: 对比主流消息队列特性，讲清何时用哪种 MQ。
order: 40
prereq: java/java-basics
---

## 一、为什么需要消息中间件

在分布式系统中，服务之间直接调用（如 HTTP RPC）会带来强耦合、同步阻塞和流量冲击等问题。引入消息中间件（Message Queue，消息队列）后，发送方把消息丢给 MQ 就返回，接收方按自己的节奏消费，二者互不依赖。它主要解决三类问题：

-   **异步**：下单后发短信、发邮件、扣积分，这些非核心链路不必阻塞主流程，扔到 MQ 让下游慢慢处理。
-   **解耦**：订单系统不需要知道有多少个下游（库存、物流、推荐）。新增消费者只需订阅，不用改生产方代码。
-   **削峰**：秒杀场景下瞬时上万请求，MQ 作为缓冲把流量存下来，下游按固定速率消费，保护数据库不被击穿。

## 二、JMS 与 AMQP

-   **JMS（Java Message Service）**：Java 平台的消息 API 规范，早期 ActiveMQ 实现。它只定义了点对点（Queue）和发布订阅（Topic）两种模型，绑定 Java 生态。
-   **AMQP（Advanced Message Queuing Protocol）**：跨语言、跨平台的有线协议，定义了交换机、队列、绑定等概念。RabbitMQ 是 AMQP 0-9-1 的经典实现，因此多语言支持极好。
-   **Kafka 协议**：Kafka 不走 JMS 也不走 AMQP，它有自己基于 TCP 的二进制协议，设计目标是高吞吐的日志/流处理，而非复杂路由。

理解这一点很关键：RabbitMQ 的核心是“消息怎么路由到队列”，Kafka 的核心是“消息怎么高效持久化和流式读取”。

## 三、Kafka 核心特性

Kafka 是 LinkedIn 开源的分布式流平台，设计哲学是“把磁盘当顺序日志用”。

-   **高吞吐**：顺序写盘 + 操作系统页缓存（PageCache）+ 零拷贝（sendfile），单机可达百万级 TPS。
-   **按分区有序**：一个 Topic 分为多个 Partition，每个 Partition 内部消息严格有序，但跨分区不保证全局顺序。
-   **Pull 拉模式**：消费者主动从 Broker 拉取数据，可控制消费速度，避免推送压垮消费者。
-   **日志/流式**：消息以追加日志形式持久化，可按 offset 重放，天然适合事件溯源、CDC、实时计算（Flink/Spark Streaming）。

典型场景：用户行为日志收集、订单事件流、实时风控、日志聚合。

## 四、RabbitMQ 核心特性

RabbitMQ 用 Erlang 编写，基于 AMQP，主打灵活路由和可靠投递。

-   **低延迟**：消息走内存路由，毫秒级投递，适合对时延敏感的业务（即时通知、交易结果推送）。
-   **复杂路由**：通过 Exchange + Binding + RoutingKey 实现 direct/fanout/topic/headers 四种路由，能把一条消息精准投递到多个队列。
-   **Push 推模式**：Broker 主动推送给消费者，配合 prefetch（QoS）限制未确认消息数，控制消费节奏。
-   **丰富的可靠性特性**：Publisher Confirm、Consumer Ack、消息持久化、死信队列、TTL 等。

典型场景：任务分发、异步下单、延迟消息（支付超时关单）、系统间可靠通知。

## 五、RocketMQ 简介

RocketMQ 是阿里开源、后捐赠 Apache 的分布式消息引擎，吸收了 Kafka 的高吞吐和 RabbitMQ 的可靠特性。它支持事务消息（半消息）、定时/延迟消息、重试队列，在金融、电商交易场景广泛使用。如果你需要 Kafka 的吞吐又要强一致的事务消息，RocketMQ 是折中选择。本系列聚焦 Kafka 与 RabbitMQ，RocketMQ 仅作了解。

## 六、常见概念对照

| 概念 | Kafka | RabbitMQ |
| --- | --- | --- |
| 消息分类 | Topic | Exchange + Queue |
| 队列单元 | Partition（分区） | Queue（队列） |
| 消费位点 | Offset | 消费后 Ack 删除 |
| 消费组 | Consumer Group | 竞争消费（一条消息一个消费者） |
| 投递模式 | Pull | Push |
| 有序性 | 分区内有序 | 队列内有序 |

补充解释关键名词：

-   **Topic**：逻辑上的消息主题，生产者发往 Topic，消费者订阅 Topic。
-   **Partition（分区）**：Kafka 中 Topic 的物理分片，是并发与并行消费的单元，也是有序性的边界。
-   **Offset**：消费者在分区上的进度指针，递增整数。
-   **Consumer Group（消费组）**：同一组的多个消费者共同消费一个 Topic，每条消息只被组内一个消费者处理（实现负载均衡），不同组之间互不影响（广播）。

## 七、选型决策表

| 维度 | 选 Kafka | 选 RabbitMQ |
| --- | --- | --- |
| 吞吐 | 极高（日志、流处理） | 中高（万级 TPS） |
| 延迟 | 较高（批量、攒批） | 低（毫秒级） |
| 路由 | 简单（按 key 分区） | 复杂（四种交换机） |
| 顺序 | 分区内严格有序 | 队列内有序 |
| 可靠性 | 依赖副本与 ack | 内建确认/持久化完善 |
| 典型场景 | 大数据管道、事件流 | 业务解耦、任务队列、延迟消息 |

一句话总结：**要做“数据管道和流处理”选 Kafka；要做“业务解耦和可靠任务投递”选 RabbitMQ。**

## 实际开发中的应用

-   电商下单：下单成功后发 Kafka 事件流，下游库存、积分、推荐各自消费，互不影响，且可重放做数据对账。
-   支付关单：下单后往 RabbitMQ 投递一条带 TTL 的延迟消息，30 分钟未支付则触发关单，利用死信队列实现。
-   日志收集：所有服务把访问日志发到 Kafka，再由 Flink 实时统计 QPS、异常率。

**常见误区**：

-   把 Kafka 当 RPC 用，期待请求-响应低延迟——Kafka 不适合强同步交互。
-   在 RabbitMQ 上跑海量日志，导致磁盘 IO 和路由开销拖垮性能。
-   忽略消费幂等，消息重投导致重复扣款——无论选哪个 MQ，消费端都要做幂等。
