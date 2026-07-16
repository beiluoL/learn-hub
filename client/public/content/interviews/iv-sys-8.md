---
question: 如何设计一个分布式配置中心？动态刷新是怎么实现的？
category: system
difficulty: hard
tags: "配置中心, Nacos, Apollo, 动态刷新, 灰度发布"
order: 50
---

分布式配置中心的本质是**将配置从代码和部署包中剥离，实现配置的集中管理、动态变更和灰度发布**。核心能力可概括为四字诀: 存、推、查、控——配置持久化存储（存）、变更实时推送（推）、版本追溯查询（查）、灰度权限回滚控制（控）。

## 配置中心的核心能力

### 1. 配置持久化与版本管理

```
配置存储模型:
  Namespace (命名空间/环境隔离)
    └── Group (分组)
          └── DataId (配置项)
                ├── Version 1 (当前)
                ├── Version 2 (历史)
                └── Version 3 (历史)
```

```sql
CREATE TABLE config_info (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    namespace VARCHAR(128) NOT NULL,
    group_name VARCHAR(128) NOT NULL DEFAULT 'DEFAULT_GROUP',
    data_id VARCHAR(256) NOT NULL,
    content TEXT NOT NULL,
    type VARCHAR(32) DEFAULT 'text',     -- text / json / yaml / properties
    md5 VARCHAR(32),                     -- 内容 MD5，用于变更检测
    version INT DEFAULT 1,
    status ENUM('DRAFT', 'PUBLISHED', 'ROLLBACKED'),
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    UNIQUE KEY uk_ns_group_id (namespace, group_name, data_id)
);

CREATE TABLE config_history (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    namespace VARCHAR(128),
    group_name VARCHAR(128),
    data_id VARCHAR(256),
    content TEXT,
    version INT,
    operation VARCHAR(32),  -- CREATE / UPDATE / DELETE / ROLLBACK
    operator VARCHAR(64),
    operated_at TIMESTAMP,
    INDEX idx_ns_data (namespace, data_id)
);
```

### 2. 配置推送机制（推拉模型）

**长轮询（Long Polling）——行业最佳实践**:

```
客户端 → 服务端: "我有配置 A v=5, B v=3, 有变更通知我"
服务端: 持有连接 30 秒
  → 30 秒内无变更: 返回 304 Not Modified
  → 30 秒内有变更: 返回变更的配置

客户端收到响应后: 立即发起下一个长轮询请求
```

```java
// Apollo 客户端长轮询伪代码
public class ConfigLongPollingService {
    private static final int LONG_POLLING_TIMEOUT = 60 * 1000; // 60 秒

    public void startLongPolling() {
        while (running) {
            try {
                // 发送长轮询请求
                List<ConfigChange> changes = requestConfigChanges(currentVersions);
                if (changes != null) {
                    notifyListeners(changes);   // 通知监听器
                }
            } catch (HttpTimeoutException e) {
                // 超时无变更，继续下一轮
            }
        }
    }

    private List<ConfigChange> requestConfigChanges(Map<String, Integer> versions) {
        // 发送: {configA: 5, configB: 3}
        // 响应: {configB: {version: 4, newValue: "..."}}  // 只有 configB 变了
        return httpClient.post("/notifications/v2", versions)
            .timeout(LONG_POLLING_TIMEOUT)
            .execute();
    }
}
```

**为什么不直接用 WebSocket?**
- 长轮询对防火墙/代理更友好（HTTP 层面）。Nacos 2.x 开始改用 gRPC 双向流作为默认通道，去除了长轮询的间歇性开销。

### 3. 动态刷新实现

Spring 生态中 `@RefreshScope` + `@Value` 是最常用的自动刷新方式:

```java
@RefreshScope
@RestController
public class OrderController {

    @Value("${order.max-items-per-order:10}")
    private int maxItems;

    @Value("${feature.vip-discount:false}")
    private boolean vipDiscount;

    @PostMapping("/orders")
    public ResponseEntity createOrder(@RequestBody OrderDto dto) {
        if (dto.getItems().size() > maxItems) {
            return ResponseEntity.badRequest()
                .body("每单最多 " + maxItems + " 件商品");
        }
        // ...
    }
}
```

**`@RefreshScope` 的原理**:

1. `@RefreshScope` 将 Bean 放入一个特殊的 Scope 中（类似 Session Scope）。
2. 配置刷新事件触发时，标记所有 `@RefreshScope` Bean 为"脏"。
3. 下次访问该 Bean 时，重新创建（应用新配置）。
4. 懒加载: 只有在下次使用时才重新创建，不影响未被访问的 Bean。

```java
// RefreshScope 的简化实现原理
@Component
public class RefreshScopeBean {
    private Object cachedBean;
    private boolean dirty = false;

    public synchronized Object getBean() {
        if (dirty || cachedBean == null) {
            cachedBean = createNewInstance();  // 用新配置创建
            dirty = false;
        }
        return cachedBean;
    }

    public void refresh() {
        dirty = true;  // 标记为脏，下次 getBean 时重建
    }
}
```

**不依赖 Spring 的通用刷新**:

```python
# Python 应用配置热更新
import threading
import time

class ConfigManager:
    _instance = None
    _lock = threading.Lock()

    def __init__(self, config_center_url):
        self.config = {}
        self.listeners = []
        self._start_long_polling(config_center_url)

    def get(self, key, default=None):
        return self.config.get(key, default)

    def _start_long_polling(self, url):
        def poll():
            while True:
                try:
                    changes = http_client.get(url, timeout=60)
                    if changes:
                        with self._lock:
                            self.config.update(changes)
                            for listener in self.listeners:
                                listener(changes)
                except Exception as e:
                    time.sleep(5)  # 出错时退避

        threading.Thread(target=poll, daemon=True).start()
```

### 4. 配置优先级与灰度发布

**配置优先级链**（Nacos 示例）:

```
Highest Priority:
  ├── 游戏/BETA 标签的灰度配置 (tag=gray_user_1001)
  ├── 机房级别配置 (zone=shanghai)
  ├── 应用级别配置 (app=order-service)
  └── 共享全局配置 (namespace=public)
Lowest Priority
```

**灰度发布流程**:

```
1. 创建灰度配置: key=order.max-items, value=20, rule=userId%100<10
2. 只有 userId hash 结果 <10 的用户（10% 流量）使用 value=20
3. 其余 90% 流量使用稳定版 value=10
4. 观察 10% 灰度无异常 → 逐步扩大灰度比例 → 全量发布
```

## Nacos vs Apollo vs Spring Cloud Config

| 维度 | Nacos | Apollo | Spring Cloud Config |
|---|---|---|---|
| 配置存储 | 内嵌 Derby/MySQL | MySQL | Git / JDBC / Vault |
| 动态刷新 | gRPC 长连接 | HTTP 长轮询 | 需要 Bus + MQ |
| 灰度发布 | IP/%/参数 灰度 | 多维度灰度 | 同 Apollo |
| 服务发现 | 内置 | 无(需配合 Eureka/Nacos) | 需配合其他 |
| 权限管理 | RBAC | 完善的命名空间权限 | 无(依赖 Git) |
| 学习成本 | 低 | 中 | 极低(Spring 原生) |
| 适用场景 | 全套微服务治理 | 只做配置管理 | 简单项目 |

**选型建议**:
- 微服务全栈: Nacos（配置 + 服务发现 + DNS 一站式）。
- 配置管理要求高 + 大团队: Apollo（权限和灰度最成熟）。
- 小项目 / GitOps: Spring Cloud Config + Git（最简单的方案）。

## 高可用设计

### 集群部署

```
[Nacos 集群: 3 节点]
   Node1 → DB(MySQL 主)
   Node2 → DB(MySQL 从1)
   Node3 → DB(MySQL 从2)
```

Nacos 使用 Raft 协议保持节点间元数据一致，配置数据本身存储在 MySQL 中（主节点写入，从节点读取）。

### 客户端容灾

```java
// 多级降级: 远程配置 → 本地缓存 → 默认值
@Value("${db.max-connections:50}")  // 默认值作为最终兜底
private int maxConnections;
```

客户端在以下情况自动降级:
1. 配置中心不可达 → 使用本地缓存的配置快照文件。
2. 本地快照不存在 → 使用代码中的 `defaultValue`。
3. 所有途径失败 → 启动失败（Fail-Fast 模式）。

## 安全设计

### 敏感配置加密

```yaml
# 存储加密
db.password: ENC(AES256:encrypted_base64_string)

# 客户端自动解密
@Value("${db.password}")
private String dbPassword;  // Spring 自动解密为明文
```

### 操作审计

```
[2024-01-15 14:32:10] 操作人: zhangsan
操作: 修改 db.max-connections 从 50 → 100
环境: production, namespace=order-service
IP: 10.0.1.25
影响实例: 12 个
```

### 回滚

```java
@PostMapping("/config/rollback")
public Result rollback(
    @RequestParam String namespace,
    @RequestParam String dataId,
    @RequestParam Integer targetVersion,
    @RequestHeader String operatorId
) {
    ConfigHistory target = configHistoryDao
        .findByVersion(namespace, dataId, targetVersion);
    if (target == null) {
        return Result.error("目标版本不存在");
    }

    // 记录审计日志
    auditLog.record(operatorId, "ROLLBACK",
        namespace, dataId, targetVersion);

    // 恢复到目标版本
    int newVersion = configService.publish(namespace, dataId, target.getContent());
    return Result.success(newVersion);
}
```

## 面试追问

- **"配置中心和数据库有什么区别？为什么不直接用数据库？"** 配置中心的核心价值是**推送能力**——配置变更后主动通知所有客户端，而数据库只能被动查询。轮询数据库的方案在高并发下会压垮 DB。另外配置中心原生支持灰度发布、审计、回滚等功能，数据库需要额外开发。
- **"长轮询和 WebSocket 各自适合什么场景？"** 长轮询实现简单，防火墙友好（HTTP层面），适合低频变更场景（配置中心）。WebSocket 双向通信，适合高频实时通信（IM/游戏/行情）。Nacos 2.x 改用 gRPC 双向流，本质上接近 WebSocket，消除了长轮询的间歇性建立连接开销。
- **"配置的灰度发布如果出错了怎么办？"** 立刻回滚灰度配置即可——因为灰度规则通常按 IP/用户 ID 匹配，撤销后所有受影响用户立刻回到原始配置。配置灰度的优势就是**即时生效、即时回滚**，不需要重启服务。
- **"配置变更如何保证所有实例原子生效？"** 实际上做不到真正的"原子生效"——不同实例因为网络延迟、GC 暂停等原因，收到配置变更的时间可能有毫秒到秒级的差异。对于要求原子生效的场景（如数据库分片规则变更），建议通过数据库开关（feature flag 表）控制，所有实例读同一张表的 flag 状态。
