---
question: Filter、Interceptor 和 Spring AOP 有什么区别？执行顺序是怎样的？
category: java
difficulty: middle
tags: "Filter, Interceptor, AOP, 执行顺序"
order: 60
---

**核心结论**：Filter、Interceptor 和 Spring AOP 是 Java Web 开发中三个阶段不同的拦截机制，三者从外到内的执行顺序为：**Filter（最外层，Servlet 容器级）→ Interceptor（中间层，Spring MVC 级）→ AOP（最内层，Spring Bean 方法级）**。选择哪个取决于所需的拦截粒度：Filter 拦截所有请求（包括静态资源），Interceptor 拦截 Spring MVC 处理器，AOP 拦截 Spring Bean 的方法调用。

## 三者区别总览（核心对比表）

| 维度           | Filter                         | Interceptor                        | Spring AOP                       |
|---------------|--------------------------------|------------------------------------|----------------------------------|
| 所属层级       | Servlet 容器级                  | Spring MVC 框架级                    | Spring 框架级，方法级             |
| 定义方式       | `javax.servlet.Filter`         | `org.springframework.web.servlet.HandlerInterceptor` | `@Aspect` + `@Before/@After`   |
| 拦截对象       | 所有进入容器的请求（含静态资源、JSP） | Controller 方法请求                     | Spring Bean 的任意方法调用       |
| 能否获取被调方法 | 否                             | 是（通过 `HandlerMethod`）          | 是（通过 `ProceedingJoinPoint`） |
| 能否修改请求参数 | 可以（包装 `HttpServletRequestWrapper`） | 否（可以修改 ModelAndView）            | 否（可以修改方法入参/返回值）     |
| 依赖注入       | 不支持（需手动获取）              | 支持 `@Autowired`（注册到 Spring 容器） | 支持                            |
| 配置方式       | `@WebFilter` 或 `FilterRegistrationBean` | `addInterceptors` 注册                | `@Aspect` + `@Component`       |
| 核心实现       | 回调函数 `doFilter()`           | `preHandle/postHandle/afterCompletion` | 代理模式（JDK 动态代理/CGLIB）    |

## 执行顺序详解

当客户端发起一个请求时，三者的执行时序如下：

```
请求到达
   ↓
Filter.doFilter() 前置逻辑
   ↓
Interceptor.preHandle()       ← 返回 true 继续，false 中止
   ↓
AOP @Before 切面
   ↓
=== Controller 方法执行 ===
   ↓
AOP @AfterReturning / @After 切面
   ↓
Interceptor.postHandle()      ← Controller 成功返回后执行，异常时跳过
   ↓
Interceptor.afterCompletion() ← 无论是否异常都执行
   ↓
Filter.doFilter() 后置逻辑（chain.doFilter 之后）
   ↓
响应返回客户端
```

## 一、Filter（Servlet 过滤器）

Filter 工作在 Servlet 容器层面（如 Tomcat），在请求到达 Servlet 之前和响应返回客户端之前执行。

```java
@WebFilter(urlPatterns = "/api/*")
public class AuthFilter implements Filter {
    @Override
    public void doFilter(ServletRequest request, ServletResponse response,
                         FilterChain chain) throws IOException, ServletException {
        HttpServletRequest httpRequest = (HttpServletRequest) request;
        System.out.println("Filter 前置: " + httpRequest.getRequestURI());

        // 处理请求（如编码设置、用户认证）
        String token = httpRequest.getHeader("Authorization");
        if (token == null) {
            ((HttpServletResponse) response).setStatus(401);
            return; // 不调用 chain.doFilter，直接中止
        }

        chain.doFilter(request, response); // 传递给下一个过滤器或目标资源

        System.out.println("Filter 后置: 响应已返回");
    }
}
```

**典型使用场景**：
- 字符编码设置（`CharacterEncodingFilter`）
- 用户认证校验（Token 校验、Session 检查）
- 请求日志记录
- XSS 攻击防御（对请求参数进行转义处理）
- CORS 跨域处理

## 二、Interceptor（Spring MVC 拦截器）

Interceptor 工作在 Spring MVC 框架层面，只能拦截经过 DispatcherServlet 分发的请求：

```java
@Component
public class PerformanceInterceptor implements HandlerInterceptor {

    private ThreadLocal<Long> startTime = new ThreadLocal<>();

    @Override
    public boolean preHandle(HttpServletRequest request,
            HttpServletResponse response, Object handler) {
        startTime.set(System.currentTimeMillis());

        // 可以获取到具体的 HandlerMethod（Controller 方法）
        if (handler instanceof HandlerMethod) {
            HandlerMethod hm = (HandlerMethod) handler;
            String className = hm.getBeanType().getSimpleName();
            String methodName = hm.getMethod().getName();
            System.out.println("调用: " + className + "." + methodName);
        }
        return true;
    }

    @Override
    public void postHandle(HttpServletRequest request,
            HttpServletResponse response, Object handler,
            ModelAndView modelAndView) {
        long duration = System.currentTimeMillis() - startTime.get();
        System.out.println("Controller 执行耗时: " + duration + "ms");
    }

    @Override
    public void afterCompletion(HttpServletRequest request,
            HttpServletResponse response, Object handler, Exception ex) {
        startTime.remove(); // 清理 ThreadLocal，防止内存泄漏
        if (ex != null) {
            System.out.println("请求处理异常: " + ex.getMessage());
        }
    }
}
```

**典型使用场景**：
- 接口请求日志（记录请求参数和耗时）
- 权限校验（通过 `handler` 参数获取方法上的自定义注解）
- 用户认证（结合 Session 判断登录状态）
- 语言/时区国际化设置

## 三、Spring AOP（面向切面编程）

AOP 工作在 Spring Bean 的方法调用层面，依赖代理模式实现：

```java
@Aspect
@Component
public class LogAspect {

    // 切入点：拦截 @Service 层所有方法
    @Pointcut("execution(* com.example.service.*.*(..))")
    public void serviceLayer() {}

    @Before("serviceLayer()")
    public void before(JoinPoint joinPoint) {
        String methodName = joinPoint.getSignature().getName();
        Object[] args = joinPoint.getArgs();
        System.out.println("AOP Before: " + methodName + " 参数: " + Arrays.toString(args));
    }

    @Around("@annotation(org.springframework.transaction.annotation.Transactional)")
    public Object aroundTransaction(ProceedingJoinPoint pjp) throws Throwable {
        System.out.println("AOP Around: 事务开始");
        try {
            Object result = pjp.proceed(); // 执行目标方法
            System.out.println("AOP Around: 事务提交");
            return result;
        } catch (Exception e) {
            System.out.println("AOP Around: 事务回滚");
            throw e;
        }
    }
}
```

**典型使用场景**：
- 事务管理（`@Transactional`）
- 缓存处理（`@Cacheable`）
- 日志记录（方法调用日志）
- 权限控制（方法级别的注解校验）
- 限流/熔断（通过计数和阈值判断）

## 多层防御的典型组合

```
Filter → 统一认证（JWT Token 校验）
    ↓
Interceptor → 接口权限（用户角色校验）
    ↓
AOP → 方法缓存（@Cacheable）
    ↓
业务逻辑
```

每层各司其职，形成纵深防御体系，体现"单一职责"原则。

## 面试官追问

**1. Filter 和 Interceptor 的核心区别是什么？**

Filter 基于函数回调（`doFilter`），由 Servlet 容器管理，拦截所有请求（包括不属于 Spring MVC 的静态资源请求）；Interceptor 基于 Java 反射机制（`HandlerInterceptor`），由 Spring 容器管理，仅拦截由 DispatcherServlet 分发的请求（不包括 `/static/` 下直接访问的静态资源）。此外，Interceptor 可以通过 `handler` 参数获取到具体的 Controller 方法和注解信息，而 Filter 做不到。

**2. 为什么 AOP 不能拦截 Filter？**

因为 AOP 基于 Spring Bean 的代理机制，目标对象必须是由 Spring 容器管理的 Bean。而 Filter 是由 Servlet 容器（如 Tomcat）创建和管理的，不属于 Spring Bean 体系，因此无法被 Spring AOP 拦截。同理，Interceptor 可以拦截是因为它注册到了 Spring MVC 的拦截器链中，由 Spring 容器管理。
