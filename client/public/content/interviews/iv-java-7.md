---
question: Spring @Transactional 什么情况下会失效？事务传播行为有哪些？
category: java
difficulty: middle
tags: "Spring, 事务, @Transactional, 传播行为"
order: 21
---

## 核心结论

**回答**：@Transactional 本质是 Spring AOP 动态代理，所有失效场景都源于"代理未生效"或"异常未触发事务回滚"。最经典的失效场景是类内部方法自调用——因为调用直接走 this 而非代理对象。7 种事务传播行为控制了"当前存在事务时该如何处理"，其中 REQUIRED（默认）和 REQUIRES_NEW 最常用。

## @Transactional 失效的 6 大场景

### 1. 非 public 方法

```java
@Service
public class OrderService {
    @Transactional
    void createOrder() { // 包级别访问，AOP 代理无法拦截
        // 事务不生效！
    }
}
```
Spring AOP 基于 JDK 动态代理或 CGLIB，只能拦截 public 方法。CGLIB 代理可以访问 protected 方法但框架层面做了限制。

### 2. 类内部自调用（最经典）

```java
@Service
public class OrderService {
    public void createOrder() {
        // 直接调用，没有走代理对象！
        this.updateInventory(); // 事务失效！
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void updateInventory() {
        // 期望新事务，但实际上与 createOrder 在同一个事务中
    }
}
```

**解决方案一**：通过 AopContext 获取当前代理对象

```java
@Service
@EnableAspectJAutoProxy(exposeProxy = true)
public class OrderService {
    public void createOrder() {
        ((OrderService) AopContext.currentProxy()).updateInventory();
    }
}
```

**解决方案二**：自己注入自己

```java
@Service
public class OrderService {
    @Autowired
    private OrderService self; // 注入代理对象

    public void createOrder() {
        self.updateInventory(); // 走代理
    }
}
```

### 3. 异常被 catch 吃掉

```java
@Transactional
public void createOrder() {
    try {
        orderDao.insert(order);
        throw new RuntimeException("库存不足");
    } catch (Exception e) {
        log.error("error", e);
        // 事务不会回滚！异常被吞了
    }
}
```
**正确做法**：catch 后手动回滚，或重新抛出异常：

```java
} catch (Exception e) {
    log.error("error", e);
    TransactionAspectSupport.currentTransactionStatus().setRollbackOnly();
    throw new RuntimeException(e); // 或抛出
}
```

### 4. rollbackFor 范围不够

```java
@Transactional // 默认只回滚 RuntimeException 和 Error
public void createOrder() throws Exception {
    orderDao.insert(order);
    throw new Exception("业务异常"); // checked 异常，不会回滚！
}

// 正确写法
@Transactional(rollbackFor = Exception.class)
```

### 5. 多线程环境

```java
@Transactional
public void createOrder() {
    new Thread(() -> {
        orderDao.insert(order); // 不在原事务中！
    }).start();
}
```
Spring 事务通过 ThreadLocal 绑定数据库连接，不同线程无法共享。

### 6. 数据库引擎不支持事务

MyISAM 存储引擎不支持事务，表结构和数据都不会回滚。务必使用 InnoDB。

## 7 种事务传播行为

| 传播行为 | 当前有事务 | 当前无事务 | 典型场景 |
|----------|------------|------------|----------|
| REQUIRED（默认） | 加入当前事务 | 新建事务 | 大多数业务方法 |
| REQUIRES_NEW | 挂起当前，新建事务 | 新建事务 | 日志记录、发短信（独立提交） |
| NESTED | 创建嵌套保存点 | 新建事务 | 部分回滚（JDBC 保存点） |
| SUPPORTS | 加入当前事务 | 非事务执行 | 查询方法 |
| NOT_SUPPORTED | 挂起当前，非事务执行 | 非事务执行 | 不需要事务的操作 |
| MANDATORY | 加入当前事务 | 抛异常 | 必须在事务中调用的方法 |
| NEVER | 抛异常 | 非事务执行 | 不允许在事务中执行 |

### REQUIRES_NEW vs NESTED 的区别

```java
@Transactional
public void outer() {
    userDao.insert(user);      // 插入用户
    try {
        innerService.createLog(); // 调用另一个事务方法
    } catch (Exception e) {
        // REQUIRES_NEW: inner 独立提交，outer 可以继续
        // NESTED: inner 回滚到保存点，outer 仍然可以提交
    }
    orderDao.insert(order);    // 插入订单
}
```

**核心差异**：REQUIRES_NEW 是完全独立的事务，内层提交/回滚完全不影响外层；NESTED 依赖 JDBC 保存点，外层回滚会连带内层一起回滚。

## 面试官视角的考察重点

设置事务超时和只读优化：

```java
// 查询操作设置为只读，MySQL InnoDB 可优化为不生成回滚日志
@Transactional(readOnly = true)
public List<Order> queryOrders() { ... }

// 长时间操作设置超时
@Transactional(timeout = 5) // 5 秒超时
public void batchProcess() { ... }
```

## 面试追问

1. **@Transactional 注解加在接口上还是类上好？** JDK 动态代理（基于接口）时注解必须在接口上；CGLIB 代理时加在类上。Spring Boot 默认 CGLIB，所以加在类上最稳妥。建议直接加在具体的 ServiceImpl 类上。

2. **大事务有什么问题？如何优化？** 长事务锁占用时间长、回滚慢、undo log 大、binlog 延迟。优化：缩小事务范围、将无关操作移出事务、异步处理非核心逻辑、拆分大事务为小事务。

3. **Spring 事务和数据库事务的关系？** Spring 事务是对 JDBC 事务的封装，最终通过 `connection.setAutoCommit(false)` → `connection.commit()` / `connection.rollback()` 实现。一个 Spring 事务操作可能涉及多个 DAO 调用，但底层共用一个 Connection（通过 DataSourceTransactionManager 的 ThreadLocal 绑定）。

4. **如何排查事务不生效？** 首先确认代理是否生效（打印 `AopUtils.isAopProxy(bean)`），再看日志中 `DataSourceTransactionManager` 的输出，确认 `Creating new transaction` 和 `Committing/Rolling back` 日志是否出现。
