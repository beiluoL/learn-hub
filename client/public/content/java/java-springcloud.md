---
title: SpringCloud 组件全景：Eureka / Gateway / OpenFeign
category: java
level: intermediate
readMinutes: 20
tags: "SpringCloud, Eureka, Gateway, OpenFeign"
summary: 梳理 SpringCloud 主流组件与微服务通信、网关路由。
order: 35
prereq: java/java-microservice-base
---

# SpringCloud 组件全景：Eureka / Gateway / OpenFeign

SpringCloud 是一套基于 SpringBoot 的微服务开发工具集，它把服务注册发现、远程调用、网关、配置中心等通用能力封装成开箱即用的组件。本篇先讲清楚版本关系，再聚焦三个最常用的组件：Eureka、OpenFeign、Gateway。

## 一、SpringCloud 与 SpringBoot 版本对应

SpringCloud 的每个大版本（代号如 2021.0 "Jubilee"、2022.0 "Kilburn"）都绑定特定范围的 SpringBoot 版本，版本不匹配会直接启动失败。官方维护了一张对照表，常用规则是：SpringCloud 2022.0.x 对应 SpringBoot 3.0.x / 3.1.x；2021.0.x 对应 SpringBoot 2.6.x / 2.7.x。引入依赖时建议使用 `spring-cloud-dependencies` 的 BOM 统一管理版本，避免冲突。

```xml
<dependencyManagement>
    <dependencies>
        <dependency>
            <groupId>org.springframework.cloud</groupId>
            <artifactId>spring-cloud-dependencies</artifactId>
            <version>2022.0.4</version>
            <type>pom</type>
            <scope>import</scope>
        </dependency>
    </dependencies>
</dependencyManagement>
```

## 二、服务注册中心 Eureka

Eureka 是 Netflix 开源的 AP 型注册中心，包含 Server 和 Client 两部分。

**搭建 Eureka Server**：

```java
@EnableEurekaServer
@SpringBootApplication
public class EurekaServerApplication {
    public static void main(String[] args) {
        SpringApplication.run(EurekaServerApplication.class, args);
    }
}
```

配置文件声明端口与自身不向自己注册：

```yaml
server:
  port: 8761
eureka:
  client:
    register-with-eureka: false
    fetch-registry: false
```

**服务注册（Client）**：在业务服务上加 `@EnableEurekaClient`（或仅引入 starter 自动注册），并配置 Eureka 地址：

```yaml
eureka:
  client:
    service-url:
      defaultZone: http://localhost:8761/eureka/
  instance:
    prefer-ip-address: true
```

启动后，服务实例会自动出现在 Eureka 控制台的服务列表中，Consumer 即可通过服务名寻址。

## 三、声明式服务调用 OpenFeign

OpenFeign 让远程调用像调用本地接口一样简单。它基于接口 + 注解生成代理，底层整合了 Ribbon（客户端负载均衡）和 Hystrix（早期熔断，新版用 Sentinel/Resilience4j 替代）。

定义一个 Feign 客户端接口：

```java
@FeignClient(
    name = "user-service",
    fallback = UserClientFallback.class)   // 失败降级类
public interface UserClient {

    @GetMapping("/api/user/{id}")
    UserDTO findById(@PathVariable("id") Long id);
}
```

调用方直接注入接口使用，无需关心 HTTP 细节与负载均衡：

```java
@Service
public class OrderService {
    @Autowired
    private UserClient userClient;

    public OrderDTO create(Long userId) {
        UserDTO user = userClient.findById(userId);  // 像本地方法一样调用
        return buildOrder(user);
    }
}
```

**降级（fallback）实现**：当被调用服务不可用或超时，执行降级逻辑返回兜底数据，保证调用方不雪崩：

```java
@Component
public class UserClientFallback implements UserClient {
    @Override
    public UserDTO findById(Long id) {
        // 返回默认兜底对象，避免整个下单链路失败
        return new UserDTO(id, "未知用户");
    }
}
```

注意：开启降级需配置 `feign.circuitbreaker.enabled=true`（结合 Spring Cloud Circuit Breaker）。

## 四、API 网关 Gateway

API 网关是所有外部请求的统一入口，承担路由转发、鉴权、限流、日志、跨域等横向职责，让后端服务专注于业务。

**核心概念**：
- **Route（路由）**：由 ID、目标 URI、一组断言（Predicate）、一组过滤器（Filter）组成。
- **Predicate（断言）**：匹配条件，如路径前缀、请求头、时间。
- **Filter（过滤器）**：对请求 / 响应做加工，如添加请求头、限流。

配置示例：把 `/api/user/**` 路由到 user-service：

```yaml
spring:
  cloud:
    gateway:
      routes:
        - id: user-route
          uri: lb://user-service      # lb 表示走负载均衡
          predicates:
            - Path=/api/user/**
          filters:
            - StripPrefix=1           # 去掉第一层路径前缀
            - name: RequestRateLimiter  # 限流过滤器
              args:
                redis-rate-limiter.replenishRate: 10
                redis-rate-limiter.burstCapacity: 20
```

`lb://user-service` 表示从注册中心按服务名解析并使用负载均衡；`StripPrefix=1` 把 `/api/user/1` 转发为 `/user/1`。

## 五、配置中心 Config / Nacos

Spring Cloud Config 将配置放在 Git 仓库，服务端拉取后提供给各客户端；Nacos 则把注册中心与配置中心合二为一，既做服务发现又做配置管理，在国内更流行。配合 `@RefreshScope` 注解可实现配置动态刷新，无需重启。

## 六、组件全景图

| 组件 | 作用 | 替代 / 同类 |
| --- | --- | --- |
| Eureka | 服务注册发现 | Nacos、Consul、ZooKeeper |
| OpenFeign | 声明式服务调用（含负载均衡） | RestTemplate、Dubbo |
| Gateway | API 网关、路由、限流 | Zuul（已停更） |
| Config / Nacos | 配置中心 | Apollo |
| Circuit Breaker | 熔断降级 | Sentinel、Hystrix（停更） |
| Sleuth / Micrometer | 链路追踪、监控 | SkyWalking、Zipkin |

## 实际开发中的应用 / 常见问题

**问题 1：Feign 调用超时？** 默认超时较短，可在配置中调整 `feign.client.config.default.connectTimeout` 与 `readTimeout`。

**问题 2：网关与 Feign 都用负载均衡，区别？** 网关是外部流量入口，做统一路由与限流；Feign 是服务内部点对点调用的客户端，专注于简化编码与熔断降级。

**问题 3：Eureka 服务下线有延迟？** Eureka 有自我保护机制与心跳间隔，实例下线后消费者可能有数十秒缓存窗口，生产环境可调整心跳与剔除参数。

**问题 4：SpringCloud 版本混乱？** 一律使用 BOM 管理版本，且严格对照官方版本兼容表，不要随意混用不同大版本的子组件。
