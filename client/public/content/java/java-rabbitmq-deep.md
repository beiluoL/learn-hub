---
title: RabbitMQ 实战：交换机、死信队列、延迟与幂等
category: java
level: advanced
readMinutes: 22
tags: "RabbitMQ, 交换机, 死信队列, 幂等"
summary: 讲透交换机类型、死信/延迟队列与消息幂等处理。
order: 42
prereq: java/java-mq-overview
---

## 一、核心模型：Exchange + Queue + Binding

RabbitMQ 不直接把消息发给队列，而是先发给 **Exchange（交换机）**，交换机根据 **RoutingKey** 和 **Binding（绑定规则）** 把消息路由到一个或多个 Queue。生产者只关心 Exchange 和 RoutingKey，消费者只关心 Queue，二者解耦。

## 二、四种交换机

-   **Direct（直连）**：消息的 RoutingKey 与 Binding 的 RoutingKey 完全匹配才路由。常用于点对点精确投递，例如按日志级别 `error` 路由到告警队列。
-   **Fanout（广播）**：忽略 RoutingKey，把消息复制发给所有绑定队列。适合“一发多消费”，如用户注册后同时发邮件、发短信、更新统计。
-   **Topic（主题）**：RoutingKey 用点号分隔（如 `order.created`），Binding 用通配符：`*` 匹配一个词，`#` 匹配零个或多个词。例如 `order.#` 匹配所有订单事件。最灵活，生产最常用。
-   **Headers（头交换）**：根据消息头（headers）的键值对匹配，而非 RoutingKey，性能较差，较少使用。

## 三、消息确认机制

可靠性依赖两端确认：

-   **Publisher Confirm（发布确认）**：生产者开启 confirm 模式后，Broker 收到消息会异步回执（ack/nack）。`channel.confirmSelect()` 后可用 `waitForConfirms()` 同步等待，确保消息到达 Broker。
-   **Consumer Ack（消费确认）**：消费者处理完再手动 `basicAck`，若处理中崩溃未 ack，消息会重新入队（或进死信），防止丢失。务必关闭自动 ack（`autoAck=false`），否则消费者一收到就删除，处理失败即丢消息。

## 四、持久化

要保证重启不丢消息，三层都要持久化：

-   Exchange 声明时 `durable=true`。
-   Queue 声明时 `durable=true`。
-   消息发送时 `MessageProperties.PERSISTENT_TEXT_PLAIN`（deliveryMode=2），消息写入磁盘。

注意：仅持久化还不够，若 Broker 在刷盘前宕机仍可能丢，需配合 Publisher Confirm 与集群镜像队列。

## 五、死信队列（DLX / DLK）

**死信（Dead Letter）**：消息在以下情况会变成死信：

-   消费者 `basicReject`/`basicNack` 且 `requeue=false`（拒绝并不重投）。
-   消息 TTL 过期。
-   队列达到最大长度（x-max-length）被丢弃。

通过给普通队列设置 `x-dead-letter-exchange`（DLX）和 `x-dead-letter-routing-key`（DLK），死信会被转发到死信交换机，再路由到死信队列，供后续排查或重试。死信队列是做“失败补偿”和“延迟队列”的基础。

## 六、延迟队列的两种实现

-   **方案 A：TTL + 死信**。给消息或队列设 TTL，过期后自动进死信队列，消费者监听死信队列即实现“延迟消费”。缺点是队列级 TTL 是固定的，且消息排队靠前会阻塞后到的短 TTL 消息（队头阻塞），需用“消息级 TTL + 死信 + 多队列”缓解。
-   **方案 B：rabbitmq-delayed-message-exchange 插件**。声明 `x-delayed-type` 的自定义交换机，发送时通过 `x-delay` 头指定毫秒级延迟，插件到点再投递。无队头阻塞问题，生产推荐。

## 七、消息幂等

网络重试、消费者崩溃重投都会导致同一条消息被消费多次。处理手段：

-   **唯一 ID + 去重表**：每条消息带业务唯一 ID（如 orderId），消费前先写去重表（数据库唯一索引或 Redis SETNX），已存在则跳过。
-   **状态机校验**：处理前检查业务状态，已处理过则直接返回。
-   **乐观锁**：UPDATE ... WHERE status='待处理'，影响行数为 0 说明已被处理。

下面是一段使用 Topic 交换机、手动 Ack、并配置死信队列的生产与消费示例：

```java
// ===== 生产者：声明 Topic 交换机、普通队列（带死信）、死信队列 =====
ConnectionFactory factory = new ConnectionFactory();
factory.setHost("localhost");
try (Connection conn = factory.newConnection();
     Channel channel = conn.createChannel()) {

    // 1) Topic 交换机（持久化）
    channel.exchangeDeclare("order.exchange", "topic", true);

    // 2) 死信交换机与死信队列
    channel.exchangeDeclare("order.dlx", "topic", true);
    channel.queueDeclare("order.dlq", true, false, false, null);
    channel.queueBind("order.dlq", "order.dlx", "order.dead");

    // 3) 普通队列，绑定死信参数（拒绝/过期/满都进死信）
    HashMap<String, Object> args = new HashMap<>();
    args.put("x-dead-letter-exchange", "order.dlx");
    args.put("x-dead-letter-routing-key", "order.dead");
    args.put("x-message-ttl", 60000); // 消息 60 秒过期 -> 进死信（延迟效果）
    channel.queueDeclare("order.queue", true, false, false, args);
    channel.queueBind("order.queue", "order.exchange", "order.created");

    // 4) 发布消息（持久化、指定 routingKey）
    AMQP.BasicProperties props = MessageProperties.PERSISTENT_TEXT_PLAIN;
    channel.basicPublish("order.exchange", "order.created",
            props, "{\"orderId\":1001}".getBytes());
}
```

```java
// ===== 消费者：手动 Ack，处理失败拒绝进死信，并做幂等 =====
Channel channel = conn.createChannel();
channel.basicQos(1); // 每次只取 1 条，处理完再取，实现公平分发
channel.basicConsume("order.queue", false, (tag, delivery) -> {
    String msg = new String(delivery.getBody());
    try {
        // 幂等：以 orderId 作为唯一键写去重表，重复则跳过
        if (!dedupTable.add(getOrderId(msg))) {
            channel.basicAck(delivery.getEnvelope().getDeliveryTag(), false);
            return;
        }
        processOrder(msg); // 业务处理
        channel.basicAck(delivery.getEnvelope().getDeliveryTag(), false); // 处理成功才 ack
    } catch (Exception e) {
        // 处理失败：拒绝且不重投 -> 进死信队列，后续重试/告警
        channel.basicNack(delivery.getEnvelope().getDeliveryTag(), false, false);
    }
}, tag -> {});
```

## 实际开发中的应用

-   **支付超时关单**：下单后发一条 30 分钟 TTL 的消息到延迟队列，到点消费检查订单状态，未支付则关闭。用插件方案避免队头阻塞。
-   **失败重试**：业务处理异常，basicNack 进死信，死信消费者做告警或有限次数重试，避免主队列被坏消息阻塞。
-   **广播通知**：Fanout 交换机一份消息同时触发邮件、短信、站内信多个队列。

**常见坑**：

-   用了自动 ack，消费者一挂消息就丢。
-   队列和消息没设 durable，重启丢数据。
-   忘记做幂等，重试导致重复扣款。
-   TTL+死信做延迟时队头阻塞，改用延迟插件。
