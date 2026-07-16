---
question: 分布式事务有哪些解决方案？2PC、TCC、最终一致性消息的对比与落地？
category: system
difficulty: hard
tags: "分布式事务, 2PC, TCC, Seata, Saga, 最终一致性"
order: 46
---

分布式事务的核心矛盾是 CAP 定理: 在分布式系统中，无法同时保证一致性（Consistency）、可用性（Availability）和分区容错性（Partition Tolerance）。实际工程中，必须在强一致性和最终一致性之间做出明确的取舍——2PC/TCC 偏向强一致但代价高昂，基于消息的最终一致性方案是互联网场景的默认选择。

## CAP 与 BASE 理论回顾

| 概念 | 含义 | 在分布式事务中的体现 |
|---|---|---|
| C 一致性 | 所有节点同一时刻数据一致 | 所有子事务要么全成功，要么全失败 |
| A 可用性 | 每个请求都能得到正确响应 | 事务不因锁定或协调而阻塞 |
| P 分区容错 | 网络分区时系统仍能工作 | 分布式事务必然面对网络不可靠 |
| BASE | 基本可用+软状态+最终一致 | 允许短暂不一致，保证最终收敛 |

**工程共识**: P 不可放弃（网络分区必然存在），因此分布式事务必须在 CP 和 AP 之间选择。2PC 偏向 CP，消息最终一致性偏向 AP。

## 2PC（Two-Phase Commit）：经典但脆弱

### 流程

```
阶段一: Prepare（投票）
  协调者 → 参与者A: "准备提交事务 T1，能提交吗？"
  协调者 → 参与者B: "准备提交事务 T1，能提交吗？"
  参与者A → 协调者: "YES"（已写入 undo/redo log）
  参与者B → 协调者: "YES"

阶段二: Commit / Rollback（决策）
  协调者 → 参与者A: "Commit"
  协调者 → 参与者B: "Commit"
  参与者A → 协调者: "ACK"
  参与者B → 协调者: "ACK"
```

### 关键问题

**单点故障**: 协调者是整个系统的单点。协调者宕机后，参与者不知道应该 Commit 还是 Rollback，事务被阻塞。

**同步阻塞**: Prepare 阶段参与者锁定资源，等待协调者的 Commit/Rollback 决策。如果某参与者慢，整个事务阻塞——违反了可用性。

**数据不一致风险**: 协调者在发送 Commit 的过程中宕机（发了 A 没发 B），A 已提交 B 未提交——数据不一致。

### 实际适用场景

2PC 仅适用于**单体应用跨数据库**或**低并发的严格金融场景**。互联网高并发场景基本不用 2PC 裸协议，都是用其改进版（如 Seata AT / TCC）。

## TCC（Try-Confirm-Cancel）：业务层的 2PC

TCC 把 2PC 的资源锁定从"数据库锁"变成"业务预留":

```
Try:   预留资源（冻结库存/锁定资金）
Confirm: 确认使用资源（扣减冻结的库存）
Cancel:  释放资源（退回冻结的库存）
```

### 代码示例

```python
class OrderService:
    def try_create_order(self, user_id, product_id, quantity):
        """Try 阶段: 预扣库存，创建待确认订单"""
        # 数据库操作
        frozen = inventory.freeze(product_id, quantity)  # 冻结库存
        if not frozen:
            return False
        order = Order(status="PENDING", user_id=user_id)
        order.save()
        return order.id

    def confirm_order(self, order_id):
        """Confirm 阶段: 确认扣减"""
        order = Order.get(order_id)
        if order.status != "PENDING":
            return  # 已经处理过了（幂等）
        inventory.confirm_frozen(order.product_id, order.quantity)
        order.status = "CONFIRMED"
        order.save()

    def cancel_order(self, order_id):
        """Cancel 阶段: 解冻库存"""
        order = Order.get(order_id)
        if order.status == "CANCELLED":
            return
        inventory.unfreeze(order.product_id, order.quantity)
        order.status = "CANCELLED"
        order.save()

# 协调者
class TCCCoordinator:
    def execute_transaction(self, services):
        """TCC 事务协调"""
        # 阶段1: Try - 全部服务预留资源
        contexts = []
        for svc in services:
            result = svc.try_phase()
            if not result.success:
                # 任一失败 → Cancel 所有已 Try 的服务
                for ctx in contexts:
                    ctx.service.cancel_phase(ctx.id)
                return False
            contexts.append(result)

        # 阶段2: Confirm - 全部确认
        for ctx in contexts:
            ctx.service.confirm_phase(ctx.id)
        return True
```

### TCC 的突出问题

**业务侵入性强**: 每个参与事务的服务都要额外实现 Try/Confirm/Cancel 三套接口，且这三套接口的逆向操作必须正确。

**空回滚**: Cancel 在 Try 之前到达（网络延迟导致）。需要在 Cancel 时检查 Try 是否已执行，未执行则记录一个空回滚标记，防止后续 Try 到达后执行。

**悬挂**: Try 在 Cancel 之后到达（先 Cancel 后 Try）。需要检查 Cancel 标记，如果存在则拒绝 Try 的执行。

```python
class TCCWithGuard:
    def try_phase(self, tx_id):
        # 检查是否已被空回滚或防悬挂
        if redis.exists(f"cancel:{tx_id}"):
            return TryResult(success=False, reason="CANCELED")
        # 正常 Try
        ...

    def cancel_phase(self, tx_id):
        # 空回滚: Try 还没执行
        redis.setex(f"cancel:{tx_id}", 3600, "1")
        ...
```

## Seata AT 模式：无侵入的 2PC 改进

Seata AT 通过数据库代理层，自动生成 undo log 和回滚 SQL:

```
业务 SQL: UPDATE account SET money = money - 100 WHERE user_id = 1

Seata 自动:
1. 记录前镜像: SELECT money FROM account WHERE user_id = 1  → money = 500
2. 执行 SQL
3. 记录后镜像: SELECT money FROM account WHERE user_id = 1  → money = 400
4. 生成 undo SQL: UPDATE account SET money = 500 WHERE user_id = 1

Commit: 删除 undo log
Rollback: 执行 undo SQL
```

**优点**: 对业务代码零侵入，只需引入 Seata 依赖和注解 `@GlobalTransactional`。

**缺点**: 依赖数据库行锁（Prepare 到 Commit 之间锁不释放），高并发时容易锁冲突。Seata 的全局锁有超时机制，但超时后释放可能导致数据不一致。

### 选型建议: TCC vs Seata AT

| 维度 | TCC | Seata AT |
|---|---|---|
| 业务侵入 | 高（需三套接口） | 低（注解即可） |
| 并发性能 | 高（无全局锁） | 中（全局锁） |
| 适用场景 | 高并发/核心交易 | 改造期/内部系统 |

## Saga 模式：长事务编排

Saga 将一个大事务拆分为多个本地事务，每个本地事务有对应的补偿事务:

```
Saga: 下单 → 扣库存 → 扣款 → 发积分
补偿:          ↑回库存 ↑退款  ↑扣回积分
```

**两种编排模式**:

**事件/编排模式（Choreography）**: 各服务通过事件驱动，各自负责自己的回滚:

```
订单服务: 创建订单 → 发布 "OrderCreated" 事件
库存服务: 监听 "OrderCreated" → 扣库存 → 发布 "InventoryDeducted" 事件
支付服务: 监听 "InventoryDeducted" → 扣款 → 发布 "PaymentCompleted" 事件
```

优点: 松耦合，跨团队友好。缺点: 整体流程不明确，难以追踪和排障。

**编排器模式（Orchestration）**: 由一个 Saga 编排器控制整个流程:

```python
class OrderSagaOrchestrator:
    def execute(self, order):
        steps = [
            SagaStep(service=InventoryService, action="deduct",
                     compensate="restore"),
            SagaStep(service=PaymentService, action="pay",
                     compensate="refund"),
            SagaStep(service=PointService, action="award",
                     compensate="revoke"),
        ]
        completed = []
        for step in steps:
            try:
                step.execute(order)
                completed.append(step)  # 记录已完成的步骤
            except StepFailedError:
                # 按相反顺序执行补偿
                for completed_step in reversed(completed):
                    completed_step.compensate(order)
                return SagaResult.FAILED
        return SagaResult.SUCCESS
```

## 最终一致性消息方案（互联网首选）

### 本地消息表

```sql
CREATE TABLE transactional_message (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    topic VARCHAR(128) NOT NULL,
    body TEXT NOT NULL,
    status ENUM('PENDING', 'SENT', 'DEAD') DEFAULT 'PENDING',
    retry_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_status_created (status, created_at)
);

-- 业务操作和消息写入在同一数据库、同一事务中
BEGIN;
  UPDATE account SET money = money - 100 WHERE user_id = 1;
  INSERT INTO transactional_message (topic, body)
    VALUES ('ORDER_PAID', '{"orderId": 12345}');
COMMIT;

-- 定时任务扫描并投递
-- SELECT * FROM transactional_message WHERE status = 'PENDING' LIMIT 100
-- 投递到 MQ → 更新 status = 'SENT'
```

### RocketMQ 事务消息

RocketMQ 内置了两阶段事务消息支持:

```java
// RocketMQ 事务消息
TransactionMQProducer producer = new TransactionMQProducer("order_group");
producer.setTransactionListener(new TransactionListener() {
    @Override
    public LocalTransactionState executeLocalTransaction(Message msg, Object arg) {
        // 执行本地事务（如扣库存）
        try {
            inventoryService.deduct(productId, quantity);
            return LocalTransactionState.COMMIT_MESSAGE;  // 提交消息
        } catch (Exception e) {
            return LocalTransactionState.ROLLBACK_MESSAGE;  // 回滚消息
        }
    }

    @Override
    public LocalTransactionState checkLocalTransaction(MessageExt msg) {
        // 事务回查：MQ 定时回调检查本地事务状态
        String txId = msg.getTransactionId();
        if (inventoryService.isTransactionSuccess(txId)) {
            return LocalTransactionState.COMMIT_MESSAGE;
        }
        return LocalTransactionState.ROLLBACK_MESSAGE;
    }
});

// 发送半消息（消费者暂时不可见）
SendResult result = producer.sendMessageInTransaction(msg, null);
```

**核心流程**:
1. 发送半消息（消费者不可见）。
2. 执行本地事务。
3. 本地事务成功 → 提交半消息，消费者可见。
4. 本地事务失败 → 回滚半消息。
5. 本地事务超时未响应 → MQ 回调 TransactionListener 查询本地事务状态。

## 选型决策表

| 场景 | 推荐方案 | 理由 |
|---|---|---|
| 跨行转账（强一致要求） | TCC | 容错好，无全局锁 |
| 电商下单（高并发/容忍短暂不一致） | 最终一致性消息 | 高性能，业务侵入小 |
| 内部管理系统的数据同步 | Seata AT | 无侵入，可接受锁等待 |
| 跨服务的长流程（>5 步） | Saga | 补偿明确，易于追踪 |
| 单体拆分微服务过渡期 | Seata AT | 低成本改造成 |
| 外部系统参与的事务 | Saga + 消息 | 外部系统无法用 TCC |

## 面试追问

- **"TCC 的 Cancel 失败怎么办？"** 重试，持续重试直到成功。Cancel 接口必须是幂等的，且最终一定能成功（如释放资源/退款一定可执行）。如果实在无法自动 Cancel，需要人工介入（报警 + 后台手动处理）。
- **"最终一致性方案的消费端如何保证不丢消息？"** 消费端手动提交 offset（Kafka `enable.auto.commit=false`），确保处理完成后才提交。处理逻辑保证幂等（用 unique key 去重）。
- **"Saga 模式中如果补偿也失败了呢？"** 补偿的重试是无限的（理论上补偿应该总能成功——退款、恢复库存总是可行的）。补偿失败意味着系统本身有问题（如退款服务挂了），需要人工介入和运维监控。
- **"怎么处理事务的超时？"** 所有分布式事务方案都需要超时和兜底。TCC 需要设置 Try→Confirm/Cancel 的超时时间；Saga 需要对每步设置超时；最终一致性消息需要定时扫描超时的半消息。超时后的操作取决于业务语义——是自动 Cancel 还是人工介入。
