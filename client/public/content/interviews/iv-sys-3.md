---
question: 如何设计一个IM即时通讯系统？核心挑战和技术方案？
category: system
difficulty: hard
tags: "系统设计, IM, WebSocket, 消息可靠性"
order: 45
---

IM 系统的核心挑战不是"把消息发出去"，而是**消息的可靠有序投递**和**大规模长连接的维护**。设计要点可以归纳为四条铁律: 消息不丢不重、时序不乱、连接不断、状态一致。以下设计以支持 1 亿用户、1000 万同时在线为目标。

## 功能拆解

### 核心功能

- **单聊**: 点对点消息投递。
- **群聊**: 一对多分发，最多 500 人群组。
- **在线状态**: 在线/离线/隐身/最后在线时间。
- **消息存储**: 离线消息/历史消息。
- **多端同步**: 手机/PC/Web 消息同步。
- **已读/未读**: 单聊已读回执，群聊未读计数。

### 非功能需求

- 端到端消息延迟 <200ms。
- 消息可靠性 99.99%（不丢不重）。
- 支持 1000 万并发长连接。

## 通信协议选型

### WebSocket 长连接（推荐）

IM 场景下 WebSocket 是唯一合理的选择:

```
客户端                       服务端
  |                            |
  |------WS Handshake--------->|
  |<-----101 Switching---------|
  |                            |
  |==== 持久双向连接 ===========|
  |                            |
  |--send(message)------------>|
  |<--onMessage(message)-------|
```

**为什么不用轮询**: 轮询的每个 HTTP 请求都有 TCP + TLS 握手开销，延迟无法做到 <200ms，且服务端压力随用户数线性增长。

**为什么不用 SSE**: SSE 是单向的（服务端→客户端），发消息还是需要 HTTP POST，增加一层复杂性。

### 协议分层设计

```
应用层:  私有 IM 协议（消息类型/ACK/心跳）
编码层:  Protobuf（比 JSON 省 60-80% 流量）
传输层:  WebSocket (TLS)
```

```protobuf
// IM 消息的 Protobuf 定义
message ImMessage {
  string message_id = 1;      // 服务端生成的全局唯一 ID
  string conversation_id = 2;  // 会话 ID
  string sender_id = 3;
  MessageType type = 4;        // TEXT / IMAGE / VIDEO / FILE / SYSTEM
  bytes content = 5;
  int64 server_timestamp = 6;  // 服务端时间戳（用于排序）
  int64 client_timestamp = 7;  // 客户端时间戳（仅用于参考）
}

enum MessageType {
  TEXT = 0;
  IMAGE = 1;
  VIDEO = 2;
  FILE = 3;
  SYSTEM = 4;
}
```

## 消息可靠投递：IM 的灵魂

### 完整投递流程

```
发送方            IM服务器          消息队列           接收方
  |                  |                 |                 |
  |--send(msg)------>|                 |                 |
  |                  |--分配msg_id     |                 |
  |                  |--入MQ持久化---->|                 |
  |<--ACK(msg_id)----|                 |                 |
  |                  |                 |--投递---------->|
  |                  |                 |<--ACK(msg_id)----| (接收方确认)
  |                  |<--标记已投递-----|                 |
```

### ACK 机制（三次握手）

```python
class MessageAckManager:
    """IM 消息的 ACK 管理"""

    def __init__(self):
        self.pending_acks = {}  # msg_id -> {status, timestamp, retry_count}

    def send_message(self, message, receiver_conn):
        """发送消息并等待 ACK"""
        self.pending_acks[message.id] = {
            "status": "PENDING",
            "timestamp": time.time(),
            "retry_count": 0,
            "message": message,
            "conn": receiver_conn,
        }
        receiver_conn.send(message)

    def handle_ack(self, msg_id):
        """处理接收方 ACK"""
        if msg_id in self.pending_acks:
            del self.pending_acks[msg_id]

    def retry_loop(self):
        """超时重试定时任务"""
        while True:
            now = time.time()
            for msg_id, state in list(self.pending_acks.items()):
                if now - state["timestamp"] > 10:  # 10 秒超时
                    if state["retry_count"] < 3:
                        # 重试投递
                        state["conn"].send(state["message"])
                        state["retry_count"] += 1
                        state["timestamp"] = now
                    else:
                        # 超出重试次数，离线存储
                        self._store_offline(state["message"])
                        del self.pending_acks[msg_id]
            time.sleep(1)
```

### 消息去重

由于网络重试，接收方可能收到同一条消息多次。去重方案: 用 `message_id` 做去重键:

```python
class MessageDeduplicator:
    """基于 Redis 的消息去重"""

    def __init__(self, redis_client):
        self.redis = redis_client
        self.DEDUP_TTL = 7 * 24 * 3600  # 7 天去重窗口

    def is_duplicate(self, message_id: str, user_id: str) -> bool:
        """检查消息是否已处理"""
        key = f"dedup:{user_id}:{message_id}"
        # SET NX: 不存在则设置，存在则返回 None（去重命中）
        added = self.redis.set(key, "1", nx=True, ex=self.DEDUP_TTL)
        return not added  # True 表示重复
```

### 时序问题

分布式系统中，谁先发送不一定谁先到达。IM 中的时序方案:

**方案 1: 服务端序列号**（推荐）

```python
# 服务端为每个会话维护一个递增的 seq_id
def deliver_message(message):
    seq_id = redis.incr(f"seq:{message.conversation_id}")
    message.server_seq = seq_id
    db.insert(message)
    push_to_receiver(message)
```

**方案 2: Lamport 逻辑时钟**

在去中心化场景下，用 Lamport 时间戳做因果关系判断:

```python
class LamportClock:
    def __init__(self):
        self.time = 0

    def tick(self):
        """发送消息前递增"""
        self.time += 1
        return self.time

    def update(self, received_time):
        """收到消息后更新"""
        self.time = max(self.time, received_time) + 1
```

实践中 IM 系统使用服务端序列号即可，Lamport 用于多活跨机房同步等复杂场景。

## 存储设计

### 消息表（分库分表）

```sql
CREATE TABLE messages_YYYY_MM (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    message_id VARCHAR(64) UNIQUE NOT NULL,  -- 全局唯一 ID
    conversation_id VARCHAR(64) NOT NULL,
    sender_id BIGINT NOT NULL,
    message_type TINYINT NOT NULL,
    content TEXT,
    server_seq BIGINT NOT NULL,  -- 会话内递增序列号
    created_at BIGINT NOT NULL,  -- 毫秒时间戳
    INDEX idx_conversation_seq (conversation_id, server_seq),
    INDEX idx_created_at (created_at)
) PARTITION BY RANGE (YEAR(created_at) * 100 + MONTH(created_at));
```

**分片策略**: 按 `conversation_id` 一致性哈希分片。同一个会话的消息存在同一分片，避免跨分片排序。

### 联系人表

```sql
CREATE TABLE contacts (
    user_id BIGINT NOT NULL,
    contact_id BIGINT NOT NULL,
    last_msg_id VARCHAR(64),    -- 最后一条消息 ID
    last_msg_preview VARCHAR(256),  -- 最后消息预览
    unread_count INT DEFAULT 0,     -- 未读计数
    is_pinned BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP,
    PRIMARY KEY (user_id, contact_id)
);
```

### 群组表

```sql
CREATE TABLE groups (
    group_id VARCHAR(64) PRIMARY KEY,
    owner_id BIGINT NOT NULL,
    name VARCHAR(128),
    max_members INT DEFAULT 500,
    created_at TIMESTAMP,
);

CREATE TABLE group_members (
    group_id VARCHAR(64) NOT NULL,
    user_id BIGINT NOT NULL,
    role ENUM('OWNER', 'ADMIN', 'MEMBER'),
    join_time TIMESTAMP,
    PRIMARY KEY (group_id, user_id)
);
```

## 分布式架构

### 接入层

负责维护 WebSocket 长连接，无状态，可水平扩展:

```
用户 A → 负载均衡(Nginx/Envoy) → 接入层节点 1
用户 B → 负载均衡(Nginx/Envoy) → 接入层节点 2
用户 C → 负载均衡(Nginx/Envoy) → 接入层节点 3
```

每个节点维护一个 `user_id → WebSocket Connection` 的映射表。

### 路由层

解决"用户 A 连节点 1，用户 B 连节点 2，A 给 B 发消息怎么路由":

```
# Redis Pub/Sub 做跨节点消息路由
# 每个接入层节点订阅自己的 channel:

# 节点 1 收到 A 发来的消息
# 查 Redis: B 的接入节点 = 节点 2
# publish("ws:node:2", message) → B 收到
```

更优方案: 用 Kafka/RocketMQ 替代 Redis Pub/Sub，获得更好的持久化和重试能力。

### 一致性哈希分片

消息存储按 `conversation_id` 一致性哈希分片:

```python
import hashlib

def shard_by_conversation(conversation_id, num_shards=64):
    hash_val = int(hashlib.md5(conversation_id.encode()).hexdigest(), 16)
    return hash_val % num_shards
```

一致性哈希在扩容时减少数据迁移量——如果用普通哈希，加一个分片所有数据都要重新分布。

## 已读/未读设计

### 单聊已读回执

```
用户 A 发送消息 → 用户 B 收到
用户 B 打开会话 → 向服务端发送 ReadReceipt(last_read_seq)
服务端更新 contacts.unread_count = 0
服务端通知用户 A: B 已读到 seq=1024
```

### 群聊未读计数（最复杂）

群聊不能每人都发已读回执（500 人群 × 500 条消息 = 25 万次更新）。方案:

```python
# 用户视角的未读数:
# 上次读到的序列号: last_read_seq = 100
# 群最新序列号: latest_seq = 155
# 有新成员加入等信息 → 需要排除系统消息
# unread = count(messages where seq > 100 AND type != SYSTEM)
```

群聊 500 人上限是设计妥协——超过 500 人的群采用"频道模式"（类似 Telegram Channel），不追踪所有人的已读状态。

## 面试追问

- **"消息已读回执能不能伪造？"** 能。客户端可以拦截并构造 ReadReceipt。真正的已读确认需要客户端披露应用层信息（屏幕在聊天界面）。企业 IM 中可增加"已读事件需附带当前 UI 状态"，但仍有伪造空间。安全场景下用应用层监控 Agent。
- **"为什么群聊要限制 500 人？"** 核心原因是写扩散——发送一条群消息要产生 N 个未读计数更新和 N 条推送。500 人是成本与体验的平衡点。超大规模群（万人级）需要读扩散方案——消息只写一份，每个用户独立拉取（类似微博 Timeline）。
- **"多端同步怎么保证？"** 每条消息标记 `device_seq`，每个设备独立维护 `last_device_seq`。新设备上线时从上次的 seq 拉取增量消息。消息内容本身按 `message_id` 去重，多端不会看到重复消息。
- **"日志删除/撤回怎样实现？"** 标记删除，并非物理删除。"此消息已被撤回"要通知所有在线接收方。时间窗口通常 2 分钟（参考微信）——因为推送已发出，超过窗口只能本地标记。
