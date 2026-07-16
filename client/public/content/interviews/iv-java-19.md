---
question: Spring MVC 的请求处理流程是怎样的？DispatcherServlet 如何工作？
category: java
difficulty: middle
tags: "Spring MVC, DispatcherServlet, 请求流程, HandlerMapping"
order: 59
---

**核心结论**：Spring MVC 的核心是**前端控制器模式**，`DispatcherServlet` 是所有请求的统一入口。一个 HTTP 请求的完整处理流程为**：**请求 → DispatcherServlet → HandlerMapping（找处理器）→ HandlerAdapter（执行处理器）→ Controller（业务处理）→ ModelAndView → ViewResolver（解析视图）→ 视图渲染 → 响应**。整个过程每个环节都是接口化设计，通过组合而非继承实现高度可扩展性。

## 完整流程图（文字版）

```
客户端请求
    ↓
DispatcherServlet.doDispatch()
    ↓
① getHandler() → HandlerMapping（返回 HandlerExecutionChain）
    ↓
② getHandlerAdapter() → 找到匹配的 HandlerAdapter
    ↓
③ 执行拦截器 preHandle()
    ↓
④ HandlerAdapter.handle() → 调用 Controller
    ↓
⑤ 返回 ModelAndView
    ↓
⑥ 执行拦截器 postHandle()
    ↓
⑦ ViewResolver.resolveViewName() → 解析为 View 对象
    ↓
⑧ View.render() → 视图渲染
    ↓
⑨ 执行拦截器 afterCompletion()
    ↓
响应返回客户端
```

## 各组件职责详解

### 1. DispatcherServlet — 前端控制器

```java
protected void doDispatch(HttpServletRequest request, HttpServletResponse response) {
    HttpServletRequest processedRequest = request;
    HandlerExecutionChain mappedHandler = null;

    try {
        // === 步骤 1：根据请求找到 Handler ===
        mappedHandler = getHandler(processedRequest);
        if (mappedHandler == null) {
            noHandlerFound(processedRequest, response);
            return;
        }

        // === 步骤 2：根据 Handler 找到适配器 ===
        HandlerAdapter ha = getHandlerAdapter(mappedHandler.getHandler());

        // === 步骤 3：执行拦截器的 preHandle ===
        if (!mappedHandler.applyPreHandle(processedRequest, response)) {
            return; // preHandle 返回 false，中止请求
        }

        // === 步骤 4：适配器执行 Handler，返回 ModelAndView ===
        ModelAndView mv = ha.handle(processedRequest, response, mappedHandler.getHandler());

        // === 步骤 5：执行拦截器的 postHandle ===
        mappedHandler.applyPostHandle(processedRequest, response, mv);

        // === 步骤 6：处理分发结果（视图解析和渲染）===
        processDispatchResult(processedRequest, response, mappedHandler, mv);

    } catch (Exception ex) {
        // 异常处理：执行拦截器的 afterCompletion
        mappedHandler.triggerAfterCompletion(processedRequest, response, ex);
    } finally {
        // 确保 afterCompletion 始终执行
        if (mappedHandler != null) {
            mappedHandler.triggerAfterCompletion(processedRequest, response, null);
        }
    }
}
```

### 2. HandlerMapping — 处理器映射器

根据请求 URL 找到对应的处理器（`@RequestMapping` 注解的方法）。Spring MVC 内置多个实现：

- `RequestMappingHandlerMapping`：处理 `@RequestMapping` 注解的方法（最常用）
- `BeanNameUrlHandlerMapping`：处理 Bean 名称以 `/` 开头的 Controller
- `SimpleUrlHandlerMapping`：通过配置映射 URL 到 Controller

`getHandler()` 返回的是一个 `HandlerExecutionChain`，其中同时包含了 Interceptor 列表。

### 3. HandlerAdapter — 处理器适配器

因为不同类型的 Controller 有不同的调用方式，`HandlerAdapter` 使用**适配器模式**统一调用接口：

- `RequestMappingHandlerAdapter`：适配 `@RequestMapping` 标注的方法
- `HttpRequestHandlerAdapter`：适配 `HttpRequestHandler`
- `SimpleControllerHandlerAdapter`：适配传统的 `Controller` 接口实现

```java
// HandlerAdapter 接口
public interface HandlerAdapter {
    boolean supports(Object handler);  // 是否支持该 Handler
    ModelAndView handle(HttpServletRequest request,
        HttpServletResponse response, Object handler); // 执行
}
```

### 4. ViewResolver — 视图解析器

将逻辑视图名称（如 `"order/list"`）解析为实际的 View 对象（如 JSP、Thymeleaf 模板）：

```java
// 常用实现
InternalResourceViewResolver resolver = new InternalResourceViewResolver();
resolver.setPrefix("/WEB-INF/views/");
resolver.setSuffix(".jsp");
// "order/list" → "/WEB-INF/views/order/list.jsp"
```

## 拦截器（Interceptor）的完整执行时序

自定义拦截器需要实现 `HandlerInterceptor` 接口：

```java
@Component
public class LogInterceptor implements HandlerInterceptor {

    // Controller 方法执行前调用，返回 false 则中止请求
    @Override
    public boolean preHandle(HttpServletRequest request,
        HttpServletResponse response, Object handler) {
        System.out.println("preHandle: 请求 " + request.getRequestURI());
        String token = request.getHeader("Authorization");
        if (token == null) {
            response.setStatus(401);
            return false; // 中止请求
        }
        return true;
    }

    // Controller 执行后、视图渲染前调用
    @Override
    public void postHandle(HttpServletRequest request,
        HttpServletResponse response, Object handler,
        ModelAndView modelAndView) {
        // 可以修改 ModelAndView，如添加通用数据
        modelAndView.addObject("serverTime", new Date());
    }

    // 视图渲染完成后调用，通常用于资源清理
    @Override
    public void afterCompletion(HttpServletRequest request,
        HttpServletResponse response, Object handler, Exception ex) {
        System.out.println("afterCompletion: 请求处理完成，耗时统计");
        // 清理 ThreadLocal、释放资源等
    }
}
```

注册拦截器：

```java
@Configuration
public class WebConfig implements WebMvcConfigurer {
    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(new LogInterceptor())
                .addPathPatterns("/api/**")
                .excludePathPatterns("/api/login", "/api/health");
    }
}
```

## 面试官追问

**1. 一个请求执行过程中，如果 Controller 抛出异常会怎样？**

首先执行 `processDispatchResult` 中的 `processHandlerException`，从注册的 `HandlerExceptionResolver` 链中查找能处理该异常的解析器（如 `@ExceptionHandler`、`@ControllerAdvice` 中的 `ExceptionHandlerExceptionResolver`）。找到匹配的异常处理方法后，会执行该方法并返回新的 ModelAndView。**关键点**：拦截器的 `afterCompletion` 无论是否有异常都会在 finally 块中执行，因此适合做资源清理和耗时统计。而 `postHandle` 只在 Controller 正常返回时执行，异常时不会执行。

**2. Spring MVC 与 Spring Boot 中的 DispatcherServlet 有何不同？**

传统 Spring MVC 需要在 `web.xml` 中手动配置 `DispatcherServlet`。Spring Boot 通过 `DispatcherServletAutoConfiguration` 自动配置，默认映射路径为 `/`，并自动注册了必要的 HandlerMapping 和 HandlerAdapter。Spring Boot 中 DispatcherServlet 的行为可通过 `spring.mvc.*` 配置前缀进行定制（如 `spring.mvc.static-path-pattern` 配置静态资源路径模式）。
