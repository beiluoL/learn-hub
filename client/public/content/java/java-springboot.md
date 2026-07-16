---
title: SpringBoot 自动装配原理与启动流程
category: java
level: intermediate
readMinutes: 18
tags: "SpringBoot, 自动装配, Starter, 启动流程"
summary: 剖析 @SpringBootApplication、SPI 机制与 Starter 自动配置。
order: 31
prereq: java/java-spring
---

# SpringBoot 自动装配原理与启动流程

SpringBoot 之所以能“开箱即用”，核心在于它的**自动装配（Auto-configuration）**机制。开发者引入一个 Starter 依赖后，无需手写大量 XML 或 `@Bean` 配置，框架会根据 classpath 中存在的类自动帮你把相关组件装配好。

## 一、@SpringBootApplication 拆解

主类上的 `@SpringBootApplication` 是一个组合注解，等价于三个注解：

**@Configuration**：标识当前类为配置类，内部可以用 `@Bean` 注册组件。

**@EnableAutoConfiguration**：开启自动装配，是自动配置的总开关。

**@ComponentScan**：扫描当前包及其子包下带有 `@Component`、`@Service`、`@Controller` 等注解的类，把它们注册为 Spring Bean。

```java
@SpringBootApplication
public class DemoApplication {
    public static void main(String[] args) {
        SpringApplication.run(DemoApplication.class, args);
    }
}
```

## 二、SPI 与自动装配的入口

`@EnableAutoConfiguration` 借助 Spring 的 SPI（Service Provider Interface）机制工作。Spring 会去读取所有 jar 包中的自动配置清单文件，从而拿到需要装配的配置类列表。

**Spring Boot 2.7 之前**：读取 `META-INF/spring.factories`，键为 `org.springframework.boot.autoconfigure.EnableAutoConfiguration`，值是自动配置类的全限定名列表。

**Spring Boot 2.7 及之后**：官方推荐使用新文件 `META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports`，每行写一个自动配置类的全限定名，格式更简洁。

## 三、@Conditional 条件装配

自动配置不是无脑加载，而是“见机行事”。Spring 提供了一整套 `@Conditional` 衍生注解，只有满足条件才会注册 Bean：

**@ConditionalOnClass**：classpath 中存在指定类时才生效（比如检测到 `RedisTemplate` 才装配 Redis 相关 Bean）。

**@ConditionalOnMissingClass**：不存在指定类时生效。

**@ConditionalOnBean / @ConditionalOnMissingBean**：容器中存在 / 不存在指定 Bean 时生效，常用于“用户没自定义就用默认的”。

**@ConditionalOnProperty**：配置文件中指定属性满足条件（如 `spring.redis.enabled=true`）才生效。

**@ConditionalOnWebApplication**：是 Web 应用时才生效。

## 四、自动装配的完整流程

1. 启动类执行 `SpringApplication.run`，进入 Spring 容器刷新流程。
2. `@EnableAutoConfiguration` 触发 `AutoConfigurationImportSelector`。
3. 该选择器通过 `SpringFactoriesLoader`（或新版的 imports 文件）读取所有候选自动配置类。
4. 利用 `spring-autoconfigure-metadata.properties` 做快速过滤，排除明显不匹配的配置。
5. 依次用 `@Conditional` 系列注解逐个判断每个配置类是否满足条件。
6. 满足条件的配置类被实例化，其中的 `@Bean` 方法被执行，组件注册进容器。
7. 用户自定义的 `@Bean`（带 `@ConditionalOnMissingBean`）会覆盖默认配置。

关键思想是：**约定优于配置 + 条件装配 + 用户配置优先**。

## 五、Starter 的约定

一个标准的 Starter 通常包含两个模块：
- `xxx-spring-boot-autoconfigure`：真正写自动配置类、条件判断、`spring.factories` / imports 文件。
- `xxx-spring-boot-starter`：空壳工程，仅依赖上面的 autoconfigure 模块和所需第三方库，供用户引入。

使用者只需 `pom.xml` 中加入 `<artifactId>xxx-spring-boot-starter</artifactId>`，即可获得一整套默认配置。

## 六、自定义一个简单 Starter

下面我们做一个“问候 Starter”，当 classpath 存在 `Greeter` 类时自动注册一个默认问候器，并允许通过配置项覆盖前缀。

自动配置类：

```java
@Configuration
@ConditionalOnClass(Greeter.class)
@EnableConfigurationProperties(GreeterProperties.class)
public class GreeterAutoConfiguration {

    @Bean
    @ConditionalOnMissingBean
    public Greeter greeter(GreeterProperties props) {
        return new Greeter(props.getPrefix());
    }
}
```

配置属性绑定类：

```java
@ConfigurationProperties(prefix = "learn.greeter")
public class GreeterProperties {
    private String prefix = "Hello";

    public String getPrefix() { return prefix; }
    public void setPrefix(String prefix) { this.prefix = prefix; }
}

public class Greeter {
    private final String prefix;
    public Greeter(String prefix) { this.prefix = prefix; }
    public String greet(String name) { return prefix + ", " + name + "!"; }
}
```

在 `resources/META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports` 中写入：

```text
com.example.autoconfigure.GreeterAutoConfiguration
```

用户在 `application.yml` 中即可配置：

```yaml
learn:
  greeter:
    prefix: "你好"
```

## 七、启动流程总览

`SpringApplication.run` 内部大致经历：构造 `SpringApplication` → 加载 `ApplicationContextInitializer` 和 `ApplicationListener` → 准备 `Environment`（读配置文件）→ 创建 `ApplicationContext` → 调用 `refresh()` 完成 BeanFactory 初始化、Bean 实例化、自动配置生效 → 发布 `ApplicationStartedEvent` 等生命周期事件 → 调用 `CommandLineRunner`/`ApplicationRunner`。

## 实际开发中的应用 / 常见问题

**问题 1：自动配置没生效？** 检查 Starter 依赖是否真正进入 classpath；确认 imports 文件路径与类名拼写正确；查看启动日志中 `ConditionEvaluationReport`，它会告诉你每个自动配置匹配或不匹配的原因。

**问题 2：想覆盖默认 Bean？** 只需在自己的 `@Configuration` 中用 `@Bean` 提供一个同类型的 Bean，配合 `@ConditionalOnMissingBean` 的默认配置会自动让位。

**问题 3：为什么我的配置类没被扫描？** `@ComponentScan` 只扫描主类所在包及其子包。若配置类在别的包，需要手动 `@Import` 或让 Starter 通过 imports 文件注册。

**问题 4：如何关闭某个自动配置？** 使用 `@SpringBootApplication(exclude = XxxAutoConfiguration.class)`，或在配置文件写 `spring.autoconfigure.exclude=...`。
