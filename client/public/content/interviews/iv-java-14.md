---
question: 微服务之间如何通信？OpenFeign 的底层原理是什么？
category: java
difficulty: middle
tags: "微服务, OpenFeign, 服务调用, 熔断, Ribbon"
order: 28
---

## 核心结论

**回答**：微服务通信分为同步调用（REST/Feign/gRPC）和异步消息（MQ）两大类。OpenFeign 的本质是声明式 HTTP 客户端，底层通过 JDK 动态代理 + 注解解析 + HttpClient 发送 HTTP 请求，整合 Ribbon 实现客户端负载均衡，整合 Sentinel/Hystrix 实现熔断降级。它让远程调用像调用本地方法一样简单。

## 微服务通信方式总览

| 类型 | 方式 | 协议 | 性能 | 耦合度 | 适用场景 |
|------|------|------|------|--------|----------|
| 同步 | REST（RestTemplate） | HTTP/JSON | 低 | 高 | 简单查询 |
| 同步 | OpenFeign | HTTP/JSON | 低 | 中 | 声明式调用 |
| 同步 | Dubbo | 自定义 RPC | 高 | 高 | 高性能 Java 服务 |
| 同步 | gRPC | HTTP/2 + Protobuf | 高 | 高 | 多语言/流式传输 |
| 异步 | RabbitMQ | AMQP | 中 | 低 | 业务解耦/削峰 |
| 异步 | Kafka | 自定义 | 高 | 低 | 大数据/日志 |
| 异步 | RocketMQ | 自定义 | 高 | 低 | 事务消息/顺序消息 |

## OpenFeign 底层原理

### JDK 动态代理

OpenFeign 的核心是使用了 JDK 动态代理：

```java
// Feign 注解声明接口
@FeignClient(name = "order-service", url = "http://order-service:8080")
public interface OrderClient {
    @GetMapping("/orders/{id}")
    OrderDTO getOrder(@PathVariable("id") Long id);
}

// OpenFeign 底层做的事情（简化）：
Object proxy = Proxy.newProxyInstance(
    OrderClient.class.getClassLoader(),
    new Class[]{OrderClient.class},
    new FeignInvocationHandler()
);
```

### 完整调用链路

```
OrderClient.getOrder(1001L)
    → JDK 动态代理拦截（ReflectiveFeign.FeignInvocationHandler.invoke）
        → MethodHandler.invoke
            → 解析接口注解和参数（@GetMapping, @PathVariable 等）
            → 构造 Request 对象（URL、Method、Headers、Body）
            → 通过 Ribbon 获取服务实例列表
            → 负载均衡选择一个实例
            → 发送 HTTP 请求（HttpURLConnection / OkHttp / Apache HttpClient）
            → 解析 HTTP 响应 → 反序列化为返回值类型
```

### Feign 客户端配置详解

```java
@Configuration
public class FeignConfig {

    @Bean
    public Logger.Level feignLoggerLevel() {
        return Logger.Level.FULL; // 打印完整的请求/响应日志
    }

    // 超时与重试配置
    @Bean
    public Request.Options options() {
        return new Request.Options(
            5, TimeUnit.SECONDS,   // connectTimeout
            10, TimeUnit.SECONDS,  // readTimeout
            true                   // followRedirects
        );
    }

    // 重试器配置
    @Bean
    public Retryer retryer() {
        return new Retryer.Default(
            1000L,  // period: 重试间隔
            2000L,  // maxPeriod: 最大重试间隔
            3       // maxAttempts: 最大重试次数
        );
    }
}
```

## 整合 Ribbon 负载均衡

Spring Cloud 2020 后 Ribbon 进入维护模式，推荐使用 Spring Cloud LoadBalancer。但面试中仍高频考察 Ribbon 原理。

### Ribbon 负载均衡策略

| 策略类 | 说明 | 适用场景 |
|--------|------|----------|
| RoundRobinRule | 轮询（默认） | 各节点性能相近 |
| RandomRule | 随机 | 非关键服务 |
| WeightedResponseTimeRule | 根据响应时间加权 | 节点性能不均衡 |
| BestAvailableRule | 选择并发最小的节点 | 短连接服务 |
| ZoneAvoidanceRule | 区域感知，优先同区域 | 多机房部署 |

### Ribbon 饥饿加载

```yaml
ribbon:
  eager-load:
    enabled: true           # 开启饥饿加载
    clients: order-service  # 指定服务名

# 默认是懒加载：第一次调用时才初始化 Ribbon 客户端，
# 饥饿加载在启动时就创建好，避免首次调用超时。
```

## 整合 Sentinel 熔断降级

```java
@Service
public class OrderServiceImpl implements OrderService {
    @Override
    @SentinelResource(
        value = "createOrder",
        fallback = "createOrderFallback",   // 降级方法
        blockHandler = "createOrderBlockHandler"  // 流控方法
    )
    public OrderDTO createOrder(OrderDTO order) {
        return orderClient.createOrder(order);
    }

    // fallback：业务异常降级
    public OrderDTO createOrderFallback(OrderDTO order, Throwable e) {
        log.error("创建订单降级: {}", e.getMessage());
        return new OrderDTO(); // 返回空对象
    }

    // blockHandler：流控/熔断触发
    public OrderDTO createOrderBlockHandler(OrderDTO order, BlockException e) {
        log.warn("创建订单被限流: {}", e.getRule().getResource());
        throw new RuntimeException("系统繁忙，请稍后重试");
    }
}
```

## 超时与重试最佳实践

```yaml
spring:
  cloud:
    openfeign:
      client:
        config:
          default:
            connect-timeout: 5000    # 连接超时 5s
            read-timeout: 10000      # 读取超时 10s
          order-service:             # 针对特定服务配置
            connect-timeout: 3000
            read-timeout: 5000
      compression:
        request:
          enabled: true
          mime-types: application/json
          min-request-size: 2048     # 大于 2KB 才压缩
```

## 重试注意事项

重试需要幂等性保障。GET 可以安全重试，POST 需要接口端支持幂等：

```java
// 错误示例：非幂等的扣款接口不应自动重试
@PostMapping("/account/deduct")  // 扣款 100 元
public void deduct(@RequestBody DeductRequest req) { }

// 正确做法：使用幂等 ID，重试不会重复扣款
@PostMapping("/account/deduct")
public void deduct(@RequestHeader("Idempotent-Key") String key, @RequestBody DeductRequest req) {
    if (idempotentService.isProcessed(key)) return;
    // 扣款逻辑
}
```

## 面试追问

1. **Feign 和 Dubbo 怎么选？** Dubbo 是 TCP 长连接的 RPC 协议，序列化用 Hessian2/Protobuf，性能比 Feign（HTTP+JSON）高 1~2 个数量级。纯 Java 微服务体系选 Dubbo，需要跨语言或对外暴露 API 选 Feign/HTTP。

2. **为什么 Spring Cloud 弃用 Ribbon？** Ribbon 已停更维护，Spring Cloud Netflix 进入维护模式。推荐 Spring Cloud LoadBalancer（Spring 官方出品）或 Nacos 自带的负载均衡。

3. **Sentinel vs Hystrix？** Hystrix 已停更。Sentinel 支持的规则更多（流量控制/熔断降级/系统保护/热点参数），控制台功能更丰富，更适合国内场景。

4. **Feign 请求拦截器有什么妙用？** 统一添加请求头（如 TraceId、Token、灰度标记）、请求日志打印、签名计算。实现 `RequestInterceptor` 接口即可全局生效。

```java
@Component
public class FeignAuthInterceptor implements RequestInterceptor {
    @Override
    public void apply(RequestTemplate template) {
        // 自动透传 TraceId 用于链路追踪
        String traceId = MDC.get("traceId");
        if (traceId != null) {
            template.header("X-Trace-Id", traceId);
        }
        // 自动添加认证 Token
        template.header("Authorization", getCurrentToken());
    }
}
```
