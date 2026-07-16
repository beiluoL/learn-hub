---
question: API 网关在微服务中起什么作用？设计时需要考虑哪些点？
category: system
difficulty: hard
tags: "API网关, 微服务, 限流, 鉴权, 路由"
order: 48
---

API 网关是微服务架构的"前门保安"——所有外部请求的第一入口。它统一处理跨横切关注点（Cross-Cutting Concerns），让后端服务专注于业务逻辑。一个设计良好的 API 网关能从源头消除大量分布式复杂度，而设计不当的网关会成为整个系统的瓶颈和单点。

## 核心功能矩阵

```
                 [客户端]
                    |
             [API 网关]
         /    |    |    \
    [路由] [鉴权] [限流] [日志]
         \    |    |    /
             [聚合层]
         /    |    |    \
    [服务A] [服务B] [服务C] [服务D]
```

### 1. 路由转发

核心: 根据请求的特征（path / header / host）将请求转发到正确的后端服务。

**路径路由**:
```yaml
# Spring Cloud Gateway 路由配置
spring:
  cloud:
    gateway:
      routes:
        - id: user-service
          uri: lb://user-service          # 负载均衡到 user-service
          predicates:
            - Path=/api/users/**
          filters:
            - StripPrefix=1               # 去掉 /api 前缀

        - id: order-service
          uri: lb://order-service
          predicates:
            - Path=/api/orders/**

        - id: v2-order-service
          uri: lb://order-service-v2
          predicates:
            - Path=/api/orders/**
            - Header=X-API-Version, v2    # 按 Header 路由到 v2 版本
```

**Header 路由**（灰度/ABTest）:
```yaml
- id: gray-route
  uri: lb://user-service-gray
  predicates:
    - Path=/api/users/**
    - Header=X-Gray-User, true
```

**权重路由**（金丝雀发布）:
```yaml
- id: canary-route
  uri: lb://user-service
  predicates:
    - Path=/api/users/**
  metadata:
    response-timeout: "1000"
  filters:
    - name: WeightedRouting
      args:
        user-service: 90      # 90% 流量到稳定版本
        user-service-canary: 10  # 10% 流量到金丝雀版本
```

### 2. 统一鉴权

将 JWT/OAuth2 校验集中在网关层，后端服务不再关心 Token 解析:

```java
// Spring Cloud Gateway 统一鉴权 Filter
@Component
public class AuthFilter implements GlobalFilter {
    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        String token = exchange.getRequest().getHeaders().getFirst("Authorization");
        if (token == null || !token.startsWith("Bearer ")) {
            exchange.getResponse().setStatusCode(HttpStatus.UNAUTHORIZED);
            return exchange.getResponse().setComplete();
        }

        try {
            // 验证 JWT Token
            Claims claims = JwtUtil.parseToken(token.substring(7));
            // 将用户信息注入请求头，透传给下游服务
            exchange.getRequest().mutate()
                .header("X-User-Id", claims.get("userId").toString())
                .header("X-User-Role", claims.get("role").toString());
        } catch (JwtException e) {
            exchange.getResponse().setStatusCode(HttpStatus.UNAUTHORIZED);
            return exchange.getResponse().setComplete();
        }

        return chain.filter(exchange);
    }
}
```

### 3. 限流（Rate Limiting）

```yaml
# 基于 Redis 的令牌桶限流
spring:
  cloud:
    gateway:
      routes:
        - id: rate-limited-route
          uri: lb://payment-service
          predicates:
            - Path=/api/payment/**
          filters:
            - name: RequestRateLimiter
              args:
                redis-rate-limiter.replenishRate: 100     # 每秒补充 100 个令牌
                redis-rate-limiter.burstCapacity: 200      # 突发容量 200
                key-resolver: "#{@userKeyResolver}"        # 按用户限流
```

### 4. 日志与审计

网关作为所有流量的唯一入口，天然适合做统一日志采集:

```java
// 记录请求/响应日志（注意脱敏）
@Component
public class LoggingFilter implements GlobalFilter {
    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        long start = System.currentTimeMillis();
        ServerHttpRequest request = exchange.getRequest();
        String traceId = request.getHeaders().getFirst("X-Trace-Id");

        return chain.filter(exchange).then(Mono.fromRunnable(() -> {
            long duration = System.currentTimeMillis() - start;
            HttpStatus status = exchange.getResponse().getStatusCode();
            log.info("{} {} {} {}ms",
                request.getMethod(), request.getPath(), status, duration);
        }));
    }
}
```

### 5. 协议转换

外部 RESTful API ↔ 内部 gRPC/Dubbo:

```
客户端(HTTP/JSON) → 网关(协议转换) → 内部服务(gRPC/Protobuf)
```

### 6. 请求聚合

将多个后端 API 响应合并为一个:

```java
// 商品详情页 = 商品信息 + 库存 + 评价，聚合为一次请求
@GetMapping("/api/product-detail/{id}")
public Mono<ProductDetail> getProductDetail(@PathVariable String id) {
    Mono<Product> product = webClient.get()
        .uri("http://product-service/products/{id}", id)
        .retrieve().bodyToMono(Product.class);

    Mono<Inventory> inventory = webClient.get()
        .uri("http://inventory-service/stock/{id}", id)
        .retrieve().bodyToMono(Inventory.class);

    Mono<List<Review>> reviews = webClient.get()
        .uri("http://review-service/reviews?productId={id}", id)
        .retrieve().bodyToFlux(Review.class).collectList();

    return Mono.zip(product, inventory, reviews)
        .map(tuple -> new ProductDetail(tuple.getT1(), tuple.getT2(), tuple.getT3()));
}
```

## 高性能设计

### 异步非阻塞

网关是 IO 密集型组件，必须使用异步非阻塞模型:

```
# 线程模型对比
同步阻塞: 1000 并发 → 1000 线程 → 大量上下文切换 → 吞吐低

异步非阻塞:
  1 个 EventLoop 线程处理 1000 个连接
  → 就绪时通过回调处理
  → 吞吐量 10x+
```

Spring Cloud Gateway 基于 WebFlux（Reactor Netty），天然异步非阻塞。

### 连接池管理

```yaml
# 后端连接池配置
spring:
  cloud:
    gateway:
      httpclient:
        pool:
          max-connections: 1000         # 最大连接数
          max-idle-time: 30s
          max-life-time: 60s
          acquire-timeout: 5000         # 获取连接超时
```

### 缓存

对频繁访问且变化慢的数据（如用户权限/系统配置），在网关层缓存:

```java
// 网关层结果缓存
@Cacheable(value = "user_permissions", key = "#userId")
public UserPermission getPermissions(String userId) {
    return permissionService.loadFromDB(userId);
}
```

## 插件化架构

成熟的网关应支持插件化扩展，典型架构:

```
          [Plugin Manager]
         /    |    |    \
    [限流] [鉴权] [日志] [自定义插件]
         \    |    |    /
          [Filter Chain]
               |
          [Router]
```

Kong 的插件模型是最佳实践:
- 插件有明确的生命周期钩子（access / header_filter / body_filter / log）。
- 插件可按 route / service / consumer 不同粒度开启。
- 插件间数据通过 context 共享。

## 主流网关选型

| 维度 | Spring Cloud Gateway | Kong | Nginx + Lua |
|---|---|---|---|
| 语言 | Java | OpenResty (Lua) | C + Lua |
| 性能 | 中（JVM） | 高 | 极高 |
| 扩展性 | 高（Spring 生态） | 高（插件市场） | 中（Lua 脚本） |
| 运维复杂度 | 低（Java 团队友好） | 中（需 DB + Admin API） | 高（手写配置） |
| 适用场景 | Java 技术栈统一 | 多语言/多团队 | 极致性能 |
| 动态配置 | 支持（Spring Cloud Config） | 支持（Admin API） | 需 reload |
| 服务发现 | 天然集成 | 需配置 | 需 lua 实现 |

**选择建议**: Java 团队首选 Spring Cloud Gateway（运维成本最低）；多语言异构团队首选 Kong；对延迟敏感到毫秒级的用 Nginx+Lua 或 Envoy。

## 安全设计

### JWT 安全

```java
// Token 安全校验清单
public TokenValidationResult validateToken(String token) {
    // 1. 签名校验（防篡改）
    // 2. 过期时间校验
    // 3. issuer 校验（防跨 issuer 攻击）
    // 4. audience 校验（防跨服务滥用）
    // 5. Token 黑名单检查（已撤销的 Token）
    // 6. 用户状态检查（账号是否已被禁用）
    // 7. 敏感操作二次鉴权（如修改密码需额外验证）
    return result;
}
```

### 防 DDoS / 恶意攻击

```yaml
# Nginx 级别的防护
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;
limit_conn_zone $binary_remote_addr zone=conn_limit:10m;

server {
    # IP 级别限流
    limit_req zone=api_limit burst=20 nodelay;
    # 连接数限制
    limit_conn conn_limit 10;
    # 请求体大小限制（防大包攻击）
    client_max_body_size 10m;
    # 超时设置（防慢速攻击）
    client_body_timeout 10s;
    client_header_timeout 10s;
}
```

## 高可用：网关自身不能成为单点

```
        [DNS / Anycast]
              |
    [LB: Nginx / Envoy / F5]
       /        |        \
  [Gateway 1] [Gateway 2] [Gateway 3]
       \        |        /
        [Service Mesh]
```

- **无状态**: 网关节点本身不存状态（限流计数放 Redis、路由配置放 Config Center）。
- **多副本**: 至少 2 副本 + 自动扩缩容（HPA）。
- **优雅重启**: 热更新配置，不丢流量。

## 面试追问

- **"API 网关和 Service Mesh 有什么区别？需要同时用吗？"** 网关管南北向流量（外部→内部），Service Mesh 管东西向流量（服务间）。两者互补——网关是门禁，Mesh 是内部交通系统。在大规模微服务中通常同时使用（如 Istio + Spring Cloud Gateway）。
- **"网关层做请求聚合有什么风险？"** 聚合降低了客户端复杂度，但增加了网关的耦合度——商品详情聚合失败可能是商品服务、库存服务或评价服务任一挂掉导致的。需要做好超时控制和熔断降级，部分服务不可用时仍能返回部分数据。
- **"怎么解决网关配置的热更新？"** Spring Cloud Gateway 集成 Nacos/Apollo 配置中心后支持配置变更自动刷新。Kong 通过 Admin API 动态更新。Nginx 原生不支持，需要 `nginx -s reload` 或使用 OpenResty 的 `lua-resty-core` 实现动态路由。
- **"网关不适合处理什么？"** 不适合: 大文件上传下载（浪费网关带宽，应直连 CDN/OBS）；长连接 WebSocket（网关通常不适合维持大量长连接，可考虑直接代理到后端）；高吞吐的流式数据（如日志/监控数据推送）。
