---
title: 服务容错：Sentinel 限流、熔断与降级实战
category: java
level: advanced
readMinutes: 18
tags: "Sentinel, 限流, 熔断, 降级"
summary: 讲解流量控制、熔断降级规则与 Sentinel 在微服务中的落地。
order: 36
prereq: java/java-springcloud
---

# 服务容错：Sentinel 限流、熔断与降级实战

在微服务架构中，一个下游服务的缓慢或故障会通过调用链向上游层层传导，最终导致整个系统被拖垮，这就是**雪崩效应**。Sentinel 是阿里巴巴开源的流量治理与容错组件，以“流量控制、熔断降级、系统保护”为核心，帮助系统在高压下保持稳定。

## 一、为什么需要 Sentinel

假设订单服务依赖用户服务，用户服务因数据库慢查询导致响应时间从 50ms 升到 5s。订单服务每个请求都卡在等待，线程被占满，进而连累调用订单服务的网关和前端，故障蔓延。Sentinel 通过**限流**控制进入系统的流量，**熔断**在依赖异常时快速失败，**降级**在系统过载时返回兜底结果，从而切断雪崩链条。

## 二、Sentinel vs Hystrix

| 维度 | Hystrix（已停止维护） | Sentinel |
| --- | --- | --- |
| 隔离策略 | 线程池 / 信号量隔离 | 基于信号量、并发线程数 |
| 熔断依据 | 异常比例、超时 | 慢调用比例、异常比例、异常数 |
| 限流 | 仅简单的线程/信号量 | 丰富的 QPS/线程数、多种流控效果 |
| 规则配置 | 代码硬编码为主 | 控制台动态配置、可持久化 |
| 实时监控 | 较弱 | 强大，秒级流量面板 |

## 三、流量控制（限流）

**统计维度**：
- **QPS**：每秒请求数，超过阈值则拒绝。
- **线程数**：并发处理的线程数，超过则拒绝，可自然保护慢调用。

**流控模式**：
- **直接**：对资源自身限流。
- **关联**：当关联资源（如“写库”）达到阈值时，限制当前资源（如“读库”），保护核心链路。
- **链路**：只针对从某个入口链路进来的调用限流，不影响其他入口。

**流控效果**：
- **快速失败**：直接抛出 `FlowException`，返回拒绝。
- **Warm Up（预热）**：阈值从低到高逐渐放开，适合冷启动（如秒杀前预热缓存）。
- **排队等待**：请求进入队列匀速通过，削峰填谷。

## 四、熔断降级

当依赖不稳定时，与其让请求一直阻塞，不如**快速失败**并走降级逻辑。Sentinel 支持三种熔断策略：

**慢调用比例**：请求响应时间超过 `maxRt` 且慢调用比例超过阈值，触发熔断，期间请求直接降级。

**异常比例**：单位时间内异常数占总请求比例超过阈值则熔断。

**异常数**：单位时间内异常数达到绝对值则熔断。

熔断后进入“打开”状态，请求直接走 blockHandler/fallback；经过设定的“半开”恢复时间后放部分流量试探，成功则关闭熔断，失败则继续打开。

## 五、@SentinelResource 与降级方法

通过 `@SentinelResource` 定义受保护的资源，并指定**限流/熔断兜底方法（blockHandler）**与**业务异常兜底方法（fallback）**。

```java
@Service
public class OrderService {

    // blockHandler 处理限流/熔断等 Sentinel 规则触发
    // fallback 处理业务方法抛出的异常（Throwable）
    @SentinelResource(
        value = "createOrder",
        blockHandler = "blockHandlerForOrder",
        fallback = "fallbackForOrder")
    public String createOrder(Long userId) {
        if (userId == null) {
            throw new IllegalArgumentException("用户为空");
        }
        return "订单创建成功，用户：" + userId;
    }

    // 必须与原方法参数一致，最后加 BlockException 参数
    public String blockHandlerForOrder(Long userId, BlockException ex) {
        return "系统繁忙，请稍后重试（限流/熔断）";
    }

    // fallback 参数与原方法一致，可加 Throwable
    public String fallbackForOrder(Long userId, Throwable t) {
        return "下单失败，已降级处理";
    }
}
```

`blockHandler` 捕获的是 Sentinel 自身的规则拦截（如 `FlowException`、`DegradeException`）；`fallback` 捕获的是目标方法本身的业务异常。两者职责不同，需配合使用。

## 六、控制台与规则持久化

Sentinel 提供可视化控制台，可实时查看每个资源的 QPS、线程数、通过/拒绝数，并**动态下发规则**（限流、熔断、热点参数、系统规则等），无需改代码重启。

但默认规则只保存在内存中，应用重启即丢失。生产环境必须**持久化**规则，常见方案：
- **推模式 + Nacos**：规则写入 Nacos 配置中心，Sentinel 监听变更并实时生效，最常用。
- **推模式 + ZooKeeper / Apollo**：类似思路，由可靠配置源做 source of truth。

客户端通过 `DataSource` 注册数据源，例如从 Nacos 拉取并监听 `FlowRule` 列表。

## 七、流控规则代码配置示例

除控制台外，也可在代码中注册规则（适合演示或测试）：

```java
@PostConstruct
public void initFlowRules() {
    List<FlowRule> rules = new ArrayList<>();
    FlowRule rule = new FlowRule();
    rule.setResource("createOrder");   // 资源名，对应 @SentinelResource 的 value
    rule.setGrade(RuleConstant.FLOW_GRADE_QPS);  // 按 QPS 限流
    rule.setCount(5);                  // 每秒最多 5 次
    rules.add(rule);
    FlowRuleManager.loadRules(rules);

    // 熔断规则：慢调用比例，RT>500ms 且比例>0.5 触发，熔断 10 秒
    List<DegradeRule> deg = new ArrayList<>();
    DegradeRule dr = new DegradeRule("createOrder")
        .setGrade(RuleConstant.DEGRADE_GRADE_RT)
        .setCount(500)
        .setSlowRatioThreshold(0.5)
        .setTimeWindow(10);
    deg.add(dr);
    DegradeRuleManager.loadRules(deg);
}
```

## 实际开发中的应用 / 常见问题

**问题 1：规则重启就没了？** 必须配置持久化数据源（推荐 Nacos 推模式），否则每次部署都需重新在控制台设置。

**问题 2：blockHandler 不生效？** 方法签名必须与原方法一致，且最后追加 `BlockException` 参数；blockHandler 所在的类默认需与资源方法同类或可被找到（可用 `blockHandlerClass` 指定）。

**问题 3：热点参数限流？** 用 `@SentinelResource` + 热点规则（ParamFlowRule），可对“某用户 ID 访问过于频繁”做精细限流，例如对热门商品 ID 单独限流而普通 ID 放行。

**问题 4：和 Gateway 限流如何分工？** Gateway 在入口层按路由做粗粒度限流（保护整体），Sentinel 在方法/资源层做细粒度限流与熔断（保护具体依赖），两者互补。
