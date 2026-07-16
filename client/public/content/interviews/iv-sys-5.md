---
question: 如何保证服务的高可用？从哪些层面设计容灾？
category: system
difficulty: hard
tags: "高可用, 容灾, 多活, 限流, 熔断"
order: 47
---

高可用是一个系统性工程，**没有任何单点方案能保证可用性**。真正的 HA 设计需要从架构、流量、数据、应用、监控五个层面逐层加固，形成纵深防御。核心思路是: 让每个组件都有冗余，让每个故障都有预案，让每次异常都能被感知。

## SLA 指标与可用性量化

| 可用性 | 年宕机时间 | 允许的恢复策略 |
|---|---|---|
| 99% (两个9) | 3.65 天 | 人工恢复，可接受非工作时间宕机 |
| 99.9% (三个9) | 8.76 小时 | 自动化恢复 + on-call 值班 |
| 99.99% (四个9) | 52.6 分钟 | 自动故障转移 + 多活 |
| 99.999% (五个9) | 5.26 分钟 | 全自动 + 多区域多活 + 无单点 |

大多数业务系统追求 99.9%（三个9）~ 99.99%（四个9）。五个9 是电信级要求，互联网业务通常不需要也不应该追求——成本指数级上升。

## 架构层：消除单点

### 集群 + 负载均衡

```
          [负载均衡]
          /    |    \
      [节点1] [节点2] [节点3]
```

**关键设计**:
- 无状态服务: 任何请求可路由到任何节点。
- 优雅停机: 摘流量（从 LB 移除）→ 等待处理中请求完成 → 关闭服务。
- 健康检查: LB 定时探测（HTTP `/health` 接口），自动摘除异常节点。

```yaml
# Kubernetes 健康检查配置
livenessProbe:
  httpGet:
    path: /healthz
    port: 8080
  initialDelaySeconds: 30
  periodSeconds: 10
  failureThreshold: 3  # 3 次失败 → 重启 Pod

readinessProbe:
  httpGet:
    path: /ready
    port: 8080
  initialDelaySeconds: 5
  periodSeconds: 5
  failureThreshold: 1  # 1 次失败 → 从 Service 摘除
```

### 多活 vs 主备

| 方案 | 流量分布 | RTO（恢复时间） | RPO（数据丢失） | 成本 |
|---|---|---|---|---|
| 主备（冷备） | 全部走主 | 分钟~小时 | 近 0 | 低 |
| 主备（热备） | 全部走主 | 秒级 | 近 0 | 中 |
| 双活 | 50/50 | 秒级 | 近 0 | 高 |
| 多活（三地+） | 按比例分 | 秒级 | 近 0 | 极高 |

**多活的核心挑战**: 数据同步延迟导致的不一致。用户的请求可能路由到不同地域，写入 A 地域后 B 地域尚未同步——需要用一致性哈希 + 用户路由（同一用户始终走同一地域）化解。

### 异地多活数据方案

```
用户 ID 一致性哈希 → 地域 A (写入主)
                    ↓ 异步同步
                   地域 B (只读副本)
                   
用户 ID 一致性哈希 → 地域 B (写入主)
                    ↓ 异步同步
                   地域 A (只读副本)
```

## 流量层：限流、熔断、降级

### 限流算法对比

**令牌桶（Token Bucket）**——当前最主流:

```python
import time
from threading import Lock

class TokenBucket:
    def __init__(self, rate, capacity):
        self.rate = rate          # 令牌生成速率（个/秒）
        self.capacity = capacity  # 桶容量
        self.tokens = capacity
        self.last_refill = time.time()
        self.lock = Lock()

    def acquire(self) -> bool:
        with self.lock:
            now = time.time()
            # 补充令牌: 经过的时间 × 速率
            elapsed = now - self.last_refill
            self.tokens = min(self.capacity, self.tokens + elapsed * self.rate)
            self.last_refill = now

            if self.tokens >= 1:
                self.tokens -= 1
                return True
            return False  # 限流

# 使用示例
bucket = TokenBucket(rate=100, capacity=200)  # 100 QPS, 允许 200 突发
if not bucket.acquire():
    raise HTTPException(status_code=429, detail="Too Many Requests")
```

**算法选型**:
| 算法 | 突发处理 | 实现复杂度 | 适用场景 |
|---|---|---|---|
| 固定窗口 | 差（临界突发） | 低 | 非关键场景 |
| 滑动窗口 | 好 | 中 | 一般 API 限流 |
| 漏桶 | 无突发 | 低 | 严格平缓流量 |
| 令牌桶 | 可控突发 | 中 | 推荐（最通用） |

### 熔断（Circuit Breaker）

当下游连续失败达到阈值，熔断器打开，拒绝请求一段时间后尝试半开:

```python
from enum import Enum
import time
import threading

class CircuitState(Enum):
    CLOSED = "closed"        # 正常通行
    OPEN = "open"            # 熔断拒绝
    HALF_OPEN = "half_open"  # 探测恢复

class CircuitBreaker:
    def __init__(self, failure_threshold=5, success_threshold=3, timeout=30):
        self.failure_threshold = failure_threshold
        self.success_threshold = success_threshold
        self.timeout = timeout  # 熔断打开后多久尝试半开
        self.state = CircuitState.CLOSED
        self.failure_count = 0
        self.success_count = 0
        self.last_failure_time = 0
        self.lock = threading.Lock()

    def call(self, func, *args, **kwargs):
        with self.lock:
            if self.state == CircuitState.OPEN:
                if time.time() - self.last_failure_time > self.timeout:
                    self.state = CircuitState.HALF_OPEN
                    self.success_count = 0
                else:
                    return CircuitBreakerError("熔断中，拒绝请求")

            try:
                result = func(*args, **kwargs)
                self._on_success()
                return result
            except Exception:
                self._on_failure()
                raise

    def _on_success(self):
        if self.state == CircuitState.HALF_OPEN:
            self.success_count += 1
            if self.success_count >= self.success_threshold:
                self.state = CircuitState.CLOSED
                self.failure_count = 0

    def _on_failure(self):
        self.failure_count += 1
        self.last_failure_time = time.time()
        if (self.state == CircuitState.CLOSED and
            self.failure_count >= self.failure_threshold):
            self.state = CircuitState.OPEN
```

### 降级策略

| 降级层级 | 操作 | 示例 |
|---|---|---|
| 功能降级 | 关闭非核心功能 | 推荐算法用兜底推荐 |
| 读降级 | 读缓存/本地数据 | 不再查询"猜你喜欢" |
| 写降级 | 本地缓存 + 异步写 | 支付时跳过风控（低金额） |
| 完全降级 | 返回默认值/静态页 | 首页 CDN 兜底 |

## 数据层：可靠性保障

### 数据库高可用

```
[主库] ← 同步复制 → [从库1] [从库2]
  ↑
 哨兵/Orchestrator
  ↓ (自动选主)
[从库1 提升为新主库]
```

**主从 + 哨兵**:
```bash
# Redis Sentinel 配置示例
sentinel monitor mymaster 192.168.1.10 6379 2
sentinel down-after-milliseconds mymaster 30000

# MySQL: Orchestrator 自动选主 + ProxySQL 切换
# 检测主库故障 → 选择最同步的从库 → 提升为主库 → 更新 Proxy 路由
```

**备份策略**: 全量备份（每日）+ 增量备份（每小时）+ Binlog 实时归档。恢复演练每季度一次，确保备份可恢复。

### 缓存穿透 / 击穿 / 雪崩防治

```python
# 缓存穿透: 查询不存在的数据 → 查 DB
# 解决: 布隆过滤器 + 空值缓存
def get_product(product_id):
    if not bloom_filter.might_contain(product_id):
        return None  # 肯定不存在
    value = cache.get(product_id)
    if value is None:
        value = db.get(product_id)
        if value:
            cache.set(product_id, value, ttl=3600)
        else:
            cache.set(product_id, "__NULL__", ttl=60)  # 空值缓存
    return value if value != "__NULL__" else None

# 缓存击穿: 热点 key 过期 → 大量请求直接打 DB
# 解决: 互斥锁
def get_hot_data(key):
    value = cache.get(key)
    if value is None:
        # 只有一个线程去查 DB，其余等待
        lock_key = f"lock:{key}"
        if cache.setnx(lock_key, 1):
            try:
                value = db.get(key)
                cache.set(key, value, ttl=3600)
            finally:
                cache.delete(lock_key)
        else:
            time.sleep(0.05)  # 等待锁释放
            value = cache.get(key)
    return value

# 缓存雪崩: 大量 key 同时过期
# 解决: 过期时间加随机值
cache.set(key, value, ttl=3600 + random.randint(0, 600))
```

## 应用层：代码层面的韧性与防护

### 无状态设计

任何请求不应依赖服务端 session。Session 信息放在 Redis 或 JWT Token 中:

```python
# JWT Token 无状态鉴权
import jwt

def verify_token(token):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        return UserInfo(user_id=payload["sub"], name=payload["name"])
    except jwt.ExpiredSignatureError:
        raise HTTPException(401, "Token 已过期")
```

### 优雅关机与就绪检测

```python
import signal
import sys

class GracefulServer:
    def __init__(self):
        self.shutting_down = False

    def start(self):
        signal.signal(signal.SIGTERM, self.handle_shutdown)
        signal.signal(signal.SIGINT, self.handle_shutdown)
        self.run()

    def handle_shutdown(self, signum, frame):
        self.shutting_down = True
        print("收到退出信号，等待处理中请求完成...")
        # 1. 从 LB 摘除自己（不再接收新请求）
        # 2. 等待现有请求处理完成（最多 30s）
        # 3. 关闭数据库连接池，释放资源
        # 4. 退出进程
```

## 监控告警：没有度量就没有可用性

### 三大支柱

```
Metrics（指标）: CPU/内存/QPS/延迟/错误率
   ↓
Logging（日志）: 结构化日志，带 TraceID
   ↓
Tracing（追踪）: 分布式链路追踪（Jaeger/Zipkin）
```

### 关键告警规则

```yaml
# Prometheus 告警规则示例
groups:
  - name: service_availability
    rules:
      - alert: HighErrorRate
        expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.01
        for: 5m
        annotations:
          summary: "错误率超过 1%，持续 5 分钟"

      - alert: HighLatency
        expr: histogram_quantile(0.99, rate(http_request_duration_seconds_bucket[5m])) > 1
        for: 5m
        annotations:
          summary: "P99 延迟超过 1 秒"

      - alert: ServiceDown
        expr: up == 0
        for: 1m
        annotations:
          summary: "服务实例失联"
```

### 黄金指标（Google SRE 四金牌）

1. **延迟（Latency）**: P50/P95/P99，区分成功和失败请求的延迟。
2. **流量（Traffic）**: QPS/并发连接数。
3. **错误（Errors）**: 5xx 比例 / 超时 / 业务错误码。
4. **饱和度（Saturation）**: CPU/内存/连接池/线程池利用率。

## 容灾演练与混沌工程

### 容灾演练的重点

- 数据库主从切换: 观察业务影响。
- 机房断电模拟: 验证多活能否接管。
- 依赖故障注入: Redis/MQ/DB 不可用时的降级。
- 全链路压测: 验证容量模型。

### 混沌工程原则

1. 在生产环境做！预发环境永远无法完全模拟生产流量和状态。
2. 从小范围开始: 先爆破一个 Pod，再一个 AZ，再一个 Region。
3. 必须可观测: 没有监控的故障注入是自杀。

## 面试追问

- **"99.99% 和 99.999% 的成本差多少？"** 跨两个数量级。主要是: 多区域部署的网络延迟和同步成本；需要完整的 Chaos Engineering 基础设施；7×24 的 NOC 团队；所有组件都必须无单点。大多数公司用 99.99% 就足够——每年 52 分钟宕机给财务系统也完全可接受。
- **"灰度发布和蓝绿发布各有利弊，怎么选？"** 蓝绿发布（瞬时切换）回滚快但需要两倍资源；灰度发布渐进式放量风险小但回滚需要时间。大流量系统（>10k QPS）用灰度；中小系统用蓝绿。Kubernetes 的 Rolling Update 本质是简版灰度。
- **"怎么防止限流误杀正常流量？"** 区分用户等级（VIP 用户不受限）、区分接口优先级（核心接口限流宽松）、用滑动窗口限流替代固定窗口（避免临界突发误杀）。Sentinel 支持这些多维度限流。
- **"监控告警的误报太多了怎么办？"** 设置持续时间内不报警（for 5min 再报警）；引入告警降噪（同服务多条告警合并为一条）；建立告警投入产出分析——每个告警都投入人力处理，不产生行动的告警立刻删除或调高阈值。
