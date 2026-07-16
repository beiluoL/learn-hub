---
title: Spring 核心：IoC 容器与依赖注入
category: java
level: advanced
readMinutes: 12
tags: Spring, IoC, DI, Bean
summary: 理解控制反转与依赖注入的本质，掌握 Bean 生命周期、作用域与三种注入方式。
order: 9
prereq: java/java-oop, java/java-collections
---

# Spring 核心：IoC 容器与依赖注入

Spring 的基石是 **IoC（控制反转）**：对象的创建与依赖关系交给容器管理，而非在代码里 `new`。**DI（依赖注入）** 是实现 IoC 的手段。

## 一、为什么需要 IoC

传统写法里，业务类自己 `new` 依赖，导致强耦合、难测试：

```java
class OrderService {
    private final PayService pay = new AlipayService(); // 写死了实现
}
```

IoC 让容器注入依赖，面向接口编程，可随时替换实现、方便 mock 测试。

## 二、三种注入方式

| 方式 | 写法 | 推荐度 |
| --- | --- | --- |
| 构造器注入 | 构造函数参数 | ⭐⭐⭐ 推荐（可保证不可变、易测） |
| Setter 注入 | set 方法 | ⭐ 可选依赖时 |
| 字段注入 | `@Autowired` 字段 | ❌ 不推荐（难测试） |

```java
@Service
public class OrderService {
    private final PayService pay;
    // 构造器注入：Spring 4.3+ 单构造器可省略 @Autowired
    public OrderService(PayService pay) {
        this.pay = pay;
    }
}
```

## 三、Bean 生命周期

1. 实例化 → 2. 属性填充（依赖注入）→ 3. `Aware` 回调 → 4. `@PostConstruct` 初始化 → 5. 使用 → 6. `@PreDestroy` 销毁。

## 四、作用域

| 作用域 | 说明 |
| --- | --- |
| singleton | 默认，容器内单例 |
| prototype | 每次获取新实例 |
| request / session | Web 请求 / 会话级 |

> 核心思想：把"我要什么"声明出来，"怎么造、何时造"交给容器。构造器注入是首选。
