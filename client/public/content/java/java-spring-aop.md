---
title: Spring AOP 与动态代理：JDK 与 CGLIB、切面实战
category: java
level: advanced
readMinutes: 20
tags: "AOP, 动态代理, 切面, 事务"
summary: 讲透 AOP 概念、JDK 与 CGLIB 代理差异及典型应用场景。
order: 30
prereq: java/java-spring
---

# Spring AOP 与动态代理：JDK 与 CGLIB、切面实战

AOP（Aspect Oriented Programming，面向切面编程）是 Spring 框架最核心的能力之一。它的目标是把那些散布在业务代码中、但又与业务逻辑无关的“横切关注点”（如日志、事务、权限校验、性能监控）抽取出来，统一管理，让业务代码保持纯净。

## 一、AOP 核心术语

**切面（Aspect）**：横切关注点的模块化，比如“日志切面”“事务切面”。一个切面 = 通知 + 切点。

**连接点（Join Point）**：程序执行过程中的一个点，比如方法调用、异常抛出。在 Spring AOP 中，连接点通常指方法的执行。

**切点（Pointcut）**：一个表达式，用来匹配哪些连接点需要被增强。切点决定了通知“织入”到哪些方法上。

**通知（Advice）**：切面在特定的连接点上执行的动作。Spring 支持五种通知：
- `@Before`：方法执行前。
- `@After`：方法执行后（无论成功失败）。
- `@AfterReturning`：方法正常返回后。
- `@AfterThrowing`：方法抛异常后。
- `@Around`：环绕方法执行，最强大，可以决定是否执行目标方法、修改参数与返回值。

**织入（Weaving）**：将切面应用到目标对象并创建代理对象的过程。Spring AOP 在运行时通过动态代理完成织入。

## 二、静态代理 vs 动态代理

**静态代理**：在编译期就手动写好代理类，代理类和目标类实现同一接口，每个方法都手动转发。缺点是类数量爆炸、维护困难。

**动态代理**：在运行时由 JVM 动态生成代理类。Spring AOP 的底层就是动态代理，开发者无需手写代理类，只需声明切面和切点即可。

## 三、JDK 动态代理与 CGLIB

Spring AOP 默认有两种代理方式：

**JDK 动态代理**：基于接口。要求目标类至少实现一个接口，运行时生成接口的代理实现类。核心类是 `java.lang.reflect.Proxy` 和 `InvocationHandler`。

**CGLIB 代理**：基于继承。通过字节码技术生成目标类的子类作为代理，因此目标类不需要实现接口。核心类是 `Enhancer` 和 `MethodInterceptor`。注意：final 类、final 方法无法被代理。

**Spring 如何选择**：
- 若目标对象实现了接口，默认使用 JDK 动态代理。
- 若目标对象没有实现接口，则使用 CGLIB。
- 如果配置了 `@EnableAspectJAutoProxy(proxyTargetClass = true)`，强制使用 CGLIB。

从 Spring Boot 2.x 开始，`spring.aop.proxy-target-class` 默认值为 `true`，即默认优先使用 CGLIB。

## 四、第一个切面：统计方法耗时

下面是一个完整的自定义切面，统计所有 Service 方法的执行耗时。

```java
@Aspect
@Component
public class PerformanceAspect {

    // 切点：com.example.service 包下所有类的所有方法
    @Pointcut("execution(* com.example.service..*(..))")
    public void serviceLayer() {}

    @Around("serviceLayer()")
    public Object measureTime(ProceedingJoinPoint pjp) throws Throwable {
        long start = System.currentTimeMillis();
        try {
            // 执行目标方法，proceed() 可传入新参数
            return pjp.proceed();
        } finally {
            long cost = System.currentTimeMillis() - start;
            String name = pjp.getSignature().toShortString();
            System.out.println("方法 " + name + " 耗时：" + cost + " ms");
        }
    }
}
```

`@Around` 通知中必须通过 `proceed()` 触发目标方法，否则目标方法不会执行。我们可以据此实现限流、重试、缓存等控制逻辑。

## 五、各类通知示例

```java
@Aspect
@Component
public class LogAspect {

    @Before("execution(* com.example.controller..*(..))")
    public void before(JoinPoint jp) {
        System.out.println("调用前：" + jp.getSignature());
    }

    @AfterReturning(
        pointcut = "execution(* com.example.service..*(..))",
        returning = "result")
    public void afterReturning(Object result) {
        System.out.println("方法返回：" + result);
    }

    @AfterThrowing(
        pointcut = "execution(* com.example.service..*(..))",
        throwing = "ex")
    public void afterThrowing(Exception ex) {
        System.err.println("方法抛异常：" + ex.getMessage());
    }
}
```

## 六、AOP 典型应用场景

**日志记录**：统一记录方法入参、出参、耗时，避免在每个方法里写日志。

**权限鉴权**：在 `@Before` 中校验当前用户是否有执行该方法的权限。

**事务管理**：Spring 的 `@Transactional` 本质上就是基于 AOP 实现的，在方法前后开启、提交或回滚事务。

**限流与熔断**：在 `@Around` 中统计调用次数，超过阈值直接拒绝。

**缓存**：在 `@Around` 中先查缓存，命中则直接返回，未命中再执行方法并写入缓存。

## 七、同类方法内部调用 AOP 不生效

这是最常见的坑：当对象内部方法 A 调用本对象的另一个方法 B，而 B 上加了 `@Transactional` 或自定义切面注解时，B 的增强不会生效。原因是对内的 `this.b()` 调用的是原始对象本身，而不是 Spring 注入的代理对象，自然绕过了代理。

```java
@Service
public class OrderService {

    public void createOrder() {
        // 自调用，insertLog 上的 AOP 不会生效！
        this.insertLog("创建订单");
    }

    @Transactional
    public void insertLog(String msg) {
        // 这里的代理增强不会触发
    }
}
```

**解决办法**：
1. 将方法拆分到不同的 Bean 中，通过依赖注入调用。
2. 从 Spring 容器中获取代理对象：`((OrderService) AopContext.currentProxy()).insertLog("...")`，需开启 `@EnableAspectJAutoProxy(exposeProxy = true)`。
3. 使用 `ApplicationContext` 重新拿到 Bean 再调用。

## 实际开发中的应用 / 常见问题

**问题 1：切面不生效？** 检查目标类是否被 Spring 管理（`@Component`/`@Service`），切点表达式是否匹配，以及是否开启了 `@EnableAspectJAutoProxy`。

**问题 2：final 方法无法代理？** CGLIB 通过继承实现，final 方法不能被重写，因此不会被增强；JDK 代理走接口则不受此限。

**问题 3：多个切面的执行顺序？** 用 `@Order(1)` 注解或实现 `Ordered` 接口控制，数字越小优先级越高。`@Around` 的 `proceed()` 之前代码按 Order 正序，`proceed()` 之后代码按反序。

**问题 4：如何拿到方法参数？** 在通知方法中声明 `JoinPoint` 参数，通过 `jp.getArgs()` 获取入参数组。
