---
question: 什么是接口幂等性？前后端如何保证接口幂等？
category: system
difficulty: middle
tags: "幂等, 唯一ID, Token, 状态机, 去重"
order: 49
---

接口幂等性是指**同一操作的多次执行所产生的影响与一次执行相同**。这不是"返回结果相同"（可能因时序返回值不同），而是"副作用相同"——余额不能因为重试扣两次。幂等是分布式系统中防御不确定性（网络超时、客户端重试、MQ 重复消费）的基石，也是生产事故中最常见的根因。

## 为什么需要幂等

### 三大重复请求来源

1. **网络重试**: 用户按钮连点 → 前端发了 3 次创建订单请求；HTTP 超时 → 客户端自动重试。
2. **消息队列重复投递**: Kafka/RocketMQ 的 At-Least-Once 语义 → 消费者可能收到重复消息。
3. **分布式事务重试**: TCC/Saga 的重试机制 → Confirm 或 Cancel 被多次调用。

### 没有幂等的结果

```
# 没有幂等保护的典型事故
用户点击"支付"→ 超时(无响应)
用户点击"重试" → 支付成功
30 秒后原请求也处理完毕 → 重复扣款
```

## 方案一：唯一 ID 去重表（最通用）

### 原理

为每次操作生成全局唯一 ID，执行前查重，执行后记录:

```sql
CREATE TABLE idempotent_requests (
    request_id VARCHAR(64) PRIMARY KEY,
    business_type VARCHAR(32) NOT NULL,  -- 'CREATE_ORDER' / 'PAYMENT'
    business_id VARCHAR(64),             -- 关联的业务 ID
    status VARCHAR(16) DEFAULT 'PROCESSING',
    response TEXT,                       -- 第一次执行的返回结果
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_business (business_type, business_id)
);
```

```python
from uuid import uuid4

class IdempotentService:
    def __init__(self, db, redis):
        self.db = db
        self.redis = redis

    def execute_with_idempotency(self, request_id, business_type, action):
        """幂等地执行业务操作"""
        # 1. 用 Redis 做快速去重（防止 DB 压力）
        redis_key = f"idempotent:{request_id}"
        if not self.redis.setnx(redis_key, "PENDING"):
            # 已存在，查询结果
            saved = self.db.query(
                "SELECT status, response FROM idempotent_requests WHERE request_id = ?",
                [request_id]
            )
            if saved.status == "PROCESSING":
                # 正在执行中，轮询等待
                for _ in range(10):
                    time.sleep(0.1)
                    saved = self.db.query("...")
                    if saved.status != "PROCESSING":
                        return saved.response
                raise TimeoutError("幂等请求超时")
            return saved.response  # 返回第一次的结果

        # 2. 记录处理中
        self.db.execute(
            "INSERT INTO idempotent_requests (request_id, business_type, status) VALUES (?, ?, 'PROCESSING')",
            [request_id, business_type]
        )

        # 3. 执行业务
        try:
            result = action()
            self.db.execute(
                "UPDATE idempotent_requests SET status='SUCCESS', response=? WHERE request_id=?",
                [result, request_id]
            )
            self.redis.setex(redis_key, 3600, "SUCCESS")
            return result
        except Exception as e:
            self.db.execute(
                "UPDATE idempotent_requests SET status='FAILED' WHERE request_id=?",
                [request_id]
            )
            self.redis.delete(redis_key)
            raise
```

### 何时生成唯一 ID

- **客户端生成**: UUID / Snowflake。满足绝大多数场景。
- **服务端生成**: 当不信任客户端时（如开放 API）。
- **业务组合 ID**: `{业务类型}_{业务时间}_{用户ID}_{随机数}`，兼具可读性。

## 方案二：Token 机制（先获取后校验）

适用于表单提交类场景:

```
客户端请求 Token → 服务端生成 Token 存入 Redis → 返回 Token
客户端提交表单(附带 Token) → 服务端校验 Token
  → Token 存在: 执行，删除 Token
  → Token 不存在: 拒绝（重复提交）
```

```python
class TokenIdempotentController:
    def get_token(self, user_id, business_type):
        """获取幂等 Token"""
        token = uuid4().hex
        key = f"token:{business_type}:{user_id}:{token}"
        redis.setex(key, 300, "1")  # Token 5 分钟有效
        return {"token": token}

    def submit_with_token(self, user_id, business_type, token, data):
        """带 Token 提交表单"""
        key = f"token:{business_type}:{user_id}:{token}"
        # ATOMIC: 检查并删除，防止并发
        if redis.delete(key) == 0:
            raise HTTPException(409, "请求已处理或 Token 无效")
        return create_order(data)
```

**Token vs 唯一 ID 的选择**:
- Token: 适合前端表单提交（先获取 Token，提交时校验）。
- 唯一 ID: 适合服务间调用、MQ 消费、支付回调（由调用方生成 ID）。

## 方案三：乐观锁

通过版本号或时间戳，确保更新只影响一次:

```sql
-- 乐观锁: 用 version 字段
UPDATE account
SET money = money - 100, version = version + 1
WHERE user_id = 1 AND version = 5;
-- 如果 affected_rows = 0，说明 version 已变（被其他请求修改了），本操作不执行
```

```python
class OptimisticLockService:
    def deduct_money(self, user_id: int, amount: float) -> bool:
        """乐观锁扣款（天然幂等）"""
        while True:
            record = db.query(
                "SELECT money, version FROM account WHERE user_id=?",
                [user_id]
            )
            if record.money < amount:
                return False  # 余额不足

            affected = db.execute(
                "UPDATE account SET money=money-?, version=version+1 "
                "WHERE user_id=? AND version=?",
                [amount, user_id, record.version]
            )
            if affected > 0:
                return True
            # affected=0 → 版本冲突，重试
```

**局限**: 乐观锁只保证更新操作幂等，对 INSERT 操作无能为力。

## 方案四：状态机约束

通过业务状态约束，使重复请求自动被忽略:

```python
class OrderService:
    STATUS_TRANSITIONS = {
        "PENDING": ["PAID", "CANCELLED"],
        "PAID": ["SHIPPED", "REFUNDING"],
        "SHIPPED": ["COMPLETED", "RETURNING"],
        "CANCELLED": [],          # 终态
        "COMPLETED": ["RETURNING"],
        "REFUNDING": ["REFUNDED"],
        "REFUNDED": [],           # 终态
    }

    def update_status(self, order_id, new_status):
        """基于状态机的状态更新（天然幂等）"""
        current = db.query("SELECT status FROM orders WHERE id=?", [order_id])

        if current.status == new_status:
            return  # 已经是目标状态，幂等返回

        if new_status not in self.STATUS_TRANSITIONS.get(current.status, []):
            raise InvalidTransition(f"不能从 {current.status} 转到 {new_status}")

        db.execute("UPDATE orders SET status=? WHERE id=?", [new_status, order_id])
```

**优势**: 不需要额外存储（唯一 ID / Token），业务语义层面天然幂等。

## 前端防重复提交

前端不是幂等的保障（不可信），但能大幅减少服务端压力:

```javascript
// 1. 按钮 Loading 态
const handleSubmit = async () => {
    if (submitting) return;  // 防重入
    setSubmitting(true);
    try {
        await api.createOrder(data);
    } finally {
        setSubmitting(false);
    }
};

// 2. 防抖（最后一次生效）
const debouncedSearch = useMemo(
    () => debounce((value) => api.search(value), 300),
    []
);

// 3. 节流（固定间隔执行）
const throttledSave = useMemo(
    () => throttle((data) => api.saveDraft(data), 1000),
    []
);
```

## 数据库唯一索引兜底

所有幂等方案的最后一道防线:

```sql
-- 支付流水表: 订单号作为唯一索引
CREATE TABLE payment_records (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    order_id VARCHAR(64) UNIQUE NOT NULL,  -- 唯一约束兜底
    amount DECIMAL(10,2),
    status VARCHAR(16),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 重复插入自动失败
INSERT INTO payment_records (order_id, amount, status)
VALUES ('ORD123', 100.00, 'SUCCESS');
-- Duplicate entry 'ORD123' for key 'order_id' → 业务层捕获并忽略
```

```java
// 业务层捕获唯一索引冲突
try {
    paymentRecordMapper.insert(record);
} catch (DuplicateKeyException e) {
    logger.info("重复支付记录已忽略: {}", record.getOrderId());
    // 查询已有记录，返回成功
    return paymentRecordMapper.selectByOrderId(record.getOrderId());
}
```

## 各方案对比

| 方案 | 适用场景 | 实现复杂度 | 性能 | 侵入性 |
|---|---|---|---|---|
| 唯一 ID 去重表 | 所有场景（最通用） | 中 | 中（DB写入） | 低 |
| Token 机制 | 表单提交 | 低 | 高 | 中 |
| 乐观锁 | 更新操作 | 低 | 高 | 低 |
| 状态机 | 有明确状态流转的场景 | 中 | 高 | 低 |
| 数据库唯一索引 | INSERT 操作兜底 | 极低 | 高 | 极低 |

## 面试追问

- **"只有数据库唯一索引够吗？"** 不够。唯一索引只能处理 INSERT 的重复，但对于需要返回已有结果的场景（如支付重试要知道"已经支付了，结果是 XXX"），唯一索引只返回错误，无法返回原始结果。所以通常需要去重表 + 唯一索引组合。
- **"唯一 ID 去重表的历史数据怎么清理？"** 按时间分区，T+7（7天）后清理。清理前归档到冷存储（如对象存储）以备审计。对于金融交易，至少保留 5 年。
- **"Token 机制放 Redis 里，Redis 宕机怎么办？"** Token 机制是"防君子不防小人"——主要防止正常用户的误操作，不是安全机制。Redis 宕机时可以降级为不校验 Token（允许重复提交的可能性），数据库唯一索引兜底。
- **"分布式场景下乐观锁的 version 怎么生成？"** Version 通常是在数据行中维护的整型字段，由数据库本地自增，不是分布式的。乐观锁的核心优势就是**不需要分布式协调**——每个分片独立维护自己的 version。如果数据本身经过了分库分表，乐观锁仍然可以直接在每个分片上工作。
