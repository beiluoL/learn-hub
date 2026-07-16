---
question: Spring 中用到了哪些设计模式？各用在什么地方？
category: java
difficulty: middle
tags: "Spring, 设计模式, IoC, AOP, 模板方法"
order: 58
---

**核心结论**：Spring 框架本身是设计模式应用的集大成者，几乎涵盖了 GoF 23 种设计模式的大半。理解 Spring 中的设计模式应用不仅能帮助深入掌握 Spring 源码，也是面试中考察框架理解深度的核心方向。最关键的八个模式依次是：**单例模式**（Bean 作用域）、**工厂模式**（BeanFactory/ApplicationContext）、**代理模式**（AOP 实现）、**模板方法模式**（JdbcTemplate/RestTemplate）、**观察者模式**（ApplicationEvent）、**适配器模式**（HandlerAdapter）、**策略模式**（Resource）、**责任链模式**（Filter Chain）。

## 1. 单例模式（Singleton）

**应用位置**：Spring Bean 的默认作用域（scope）。

Spring 容器管理的 Bean 默认是单例的，通过 `DefaultSingletonBeanRegistry` 中的三级缓存（`singletonObjects`、`earlySingletonObjects`、`singletonFactories`）来管理单例 Bean 的创建和获取：

```java
// DefaultSingletonBeanRegistry.java
public class DefaultSingletonBeanRegistry extends SimpleAliasRegistry implements SingletonBeanRegistry {
    // 一级缓存：完全初始化的单例 Bean
    private final Map<String, Object> singletonObjects = new ConcurrentHashMap<>(256);
    // 二级缓存：早期暴露的半成品 Bean（解决循环依赖）
    private final Map<String, Object> earlySingletonObjects = new HashMap<>(16);
    // 三级缓存：Bean 工厂对象
    private final Map<String, ObjectFactory<?>> singletonFactories = new HashMap<>(16);
}
```

可以通过 `@Scope("prototype")` 切换为多例模式。

## 2. 工厂模式（Factory / Factory Method）

**应用位置**：`BeanFactory` 和 `ApplicationContext`。

`BeanFactory` 是 Spring IoC 容器的根接口，定义了最基本的获取 Bean 的方法：

```java
public interface BeanFactory {
    Object getBean(String name);
    <T> T getBean(Class<T> requiredType);
    boolean containsBean(String name);
    // ...
}
```

`ApplicationContext` 继承 `BeanFactory`，在工厂模式基础上扩展了更多企业级功能（事件发布、国际化、资源加载等）。Spring 通过 `BeanFactoryPostProcessor` 在工厂创建完成后对 Bean 定义进行后处理，体现了工厂模式的灵活性。

## 3. 代理模式（Proxy）

**应用位置**：AOP（面向切面编程）的核心实现。

Spring AOP 基于动态代理实现，根据目标类是否实现接口自动选择代理方式：

```java
public class DefaultAopProxyFactory implements AopProxyFactory {
    public AopProxy createAopProxy(AdvisedSupport config) {
        if (config.isOptimize() || config.isProxyTargetClass()
                || hasNoUserSuppliedProxyInterfaces(config)) {
            Class<?> targetClass = config.getTargetClass();
            // 实现接口则使用 JDK 动态代理
            if (targetClass.isInterface() || Proxy.isProxyClass(targetClass)) {
                return new JdkDynamicAopProxy(config);
            }
            // 未实现接口则使用 CGLIB 代理
            return new ObjenesisCglibAopProxy(config);
        }
        return new JdkDynamicAopProxy(config);
    }
}
```

**JDK 动态代理**：基于接口，使用 `java.lang.reflect.Proxy` + `InvocationHandler`。
**CGLIB 代理**：基于继承，通过字节码技术生成目标类的子类。

Spring 事务管理 `@Transactional`、缓存 `@Cacheable`、权限控制等切面功能全部依赖此模式。

## 4. 模板方法模式（Template Method）

**应用位置**：`JdbcTemplate`、`RestTemplate`、`RedisTemplate`、`TransactionTemplate` 等。

以 `JdbcTemplate` 为例，它定义了数据库操作的骨架流程（获取连接→执行 SQL→处理结果→释放连接），将可变的"执行 SQL"和"处理结果"部分留给回调接口：

```java
// 简化示意
public class JdbcTemplate {
    public <T> T query(String sql, RowMapper<T> rowMapper) {
        Connection conn = null;
        PreparedStatement ps = null;
        ResultSet rs = null;
        try {
            conn = dataSource.getConnection();    // 固定步骤：获取连接
            ps = conn.prepareStatement(sql);      // 固定步骤：创建 Statement
            rs = ps.executeQuery();               // 固定步骤：执行查询
            // 可变步骤：结果映射（由回调 RowMapper 实现）
            return rowMapper.mapRow(rs, rs.getRow());
        } finally {
            // 固定步骤：释放资源
            close(rs, ps, conn);
        }
    }
}
```

使用者只需关注 `RowMapper` 的实现，无需处理繁琐的 JDBC 样板代码。

## 5. 观察者模式（Observer）

**应用位置**：Spring 事件机制 `ApplicationEvent` + `ApplicationListener`。

```java
// 定义事件
public class OrderCreatedEvent extends ApplicationEvent {
    private Long orderId;
    public OrderCreatedEvent(Object source, Long orderId) {
        super(source);
        this.orderId = orderId;
    }
    public Long getOrderId() { return orderId; }
}

// 监听器
@Component
public class OrderEventListener implements ApplicationListener<OrderCreatedEvent> {
    @Override
    public void onApplicationEvent(OrderCreatedEvent event) {
        System.out.println("收到订单创建事件: " + event.getOrderId());
        // 发送通知、更新库存等
    }
}

// 发布事件
@Autowired
private ApplicationEventPublisher publisher;
publisher.publishEvent(new OrderCreatedEvent(this, 12345L));
```

Spring 通过 `SimpleApplicationEventMulticaster` 负责事件广播，支持同步和异步两种模式（使用 `@Async` 或配置线程池）。

## 6. 适配器模式（Adapter）

**应用位置**：Spring MVC 的 `HandlerAdapter`。

Spring MVC 处理请求时，需要通过 `HandlerAdapter` 适配不同类型的处理器（`@Controller`、`HttpRequestHandler`、`Servlet` 等）：

```java
public class SimpleControllerHandlerAdapter implements HandlerAdapter {
    public boolean supports(Object handler) {
        return (handler instanceof Controller);
    }
    public ModelAndView handle(HttpServletRequest request,
        HttpServletResponse response, Object handler) {
        return ((Controller) handler).handleRequest(request, response);
    }
}
```

DispatcherServlet 不需要知道具体处理器类型，只需通过 `HandlerAdapter` 调用统一的 `handle()` 方法。

## 7. 策略模式（Strategy）

**应用位置**：Spring 的 `Resource` 接口。

Spring 通过统一的 `Resource` 接口屏蔽了底层资源的差异性：

```java
// 不同的实现类代表不同的策略
Resource classPathResource = new ClassPathResource("application.properties");
Resource urlResource = new UrlResource("https://example.com/config.properties");
Resource fileSystemResource = new FileSystemResource("/opt/app/config.properties");

// 统一访问方式
InputStream is = resource.getInputStream();
String filename = resource.getFilename();
boolean exists = resource.exists();
```

所有资源类型都实现相同的 `Resource` 接口，使用方无需关心底层是文件系统、类路径还是远程 URL。

## 8. 责任链模式（Chain of Responsibility）

**应用位置**：Spring Security 的过滤器链、Spring MVC 的拦截器链。

```java
// Filter Chain 示意
public interface FilterChain {
    void doFilter(ServletRequest request, ServletResponse response);
}
```

责任链中的每个节点都有机会处理请求，处理完毕后决定是否将请求传递给下一个节点。Spring Security 基于此模式构建了整个安全认证授权体系。

## Spring 设计模式总览

| 设计模式       | Spring 中的应用                        | 核心作用                 |
|---------------|---------------------------------------|-------------------------|
| 单例模式       | Bean 默认 scope                         | 节省资源，全局共享         |
| 工厂模式       | BeanFactory / ApplicationContext       | Bean 创建与依赖注入        |
| 代理模式       | AOP、事务管理                           | 在不修改源码的情况下增强功能 |
| 模板方法       | JdbcTemplate、RestTemplate             | 封装固定流程，暴露可变部分   |
| 观察者模式     | ApplicationEvent / Listener            | 事件驱动，解耦组件通信     |
| 适配器模式     | HandlerAdapter                         | 统一不同处理器的调用接口    |
| 策略模式       | Resource 接口                          | 封装不同资源的访问方式     |
| 责任链模式     | FilterChain、Interceptor                | 请求逐级过滤和处理        |

## 面试官追问

**1. Spring 事务管理用了哪些设计模式？**

**代理模式**是最核心的，`@Transactional` 注解通过 AOP 代理实现事务的开启、提交和回滚。**模板方法模式**体现在 `TransactionTemplate`，将事务的固定流程（begin→execute→commit/rollback）封装。**策略模式**体现在 `PlatformTransactionManager` 的多种实现（DataSourceTransactionManager、JtaTransactionManager 等），通过依赖注入选择不同的事务管理器策略。

**2. 为什么不直接用 JDK 动态代理，还需要 CGLIB？**

JDK 动态代理要求目标类必须实现接口，如果目标类没有实现任何接口，JDK 代理就无能为力。CGLIB 通过继承目标类生成子类来代理，无需接口。Spring 中选择代理策略的逻辑是：如果目标对象实现了接口，默认使用 JDK 动态代理；否则使用 CGLIB。也可通过 `proxyTargetClass=true` 强制使用 CGLIB。
