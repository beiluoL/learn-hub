---
title: Spring 事务管理：传播行为、隔离级别与失效场景
category: java
level: advanced
readMinutes: 22
tags: "事务, 传播行为, 失效, @Transactional"
summary: 详解七种传播行为、隔离级别及 @Transactional 不生效的常见坑。
order: 32
prereq: java/java-spring
---

# Spring 事务管理：传播行为、隔离级别与失效场景

Spring 的事务管理建立在 AOP 代理之上，它让开发者用一行 `@Transactional` 就能为方法开启数据库事务，而不用手写 `connection.setAutoCommit(false)`、`commit()`、`rollback()`。但要真正用对事务，必须理解它的传播行为、隔离级别，以及那些最容易踩的“失效”坑。

## 一、声明式事务的本质

`@Transactional` 是声明式事务，底层就是通过 AOP 动态代理：在方法执行前开启事务（从连接池借连接、关闭自动提交），方法正常结束则提交，抛异常则回滚，最后把连接归还。这使得业务代码与事务控制彻底解耦。

```java
@Service
public class AccountService {

    @Transactional
    public void transfer(Long from, Long to, BigDecimal amount) {
        accountDao.decrease(from, amount);
        accountDao.increase(to, amount);
        // 中途抛异常会自动回滚，两个更新都不会生效
    }
}
```

## 二、七种传播行为

传播行为定义：**当一个事务方法被另一个事务方法调用时，事务如何传播**。通过 `propagation` 属性设置，枚举为 `Propagation`。

| 传播行为 | 含义 | 典型场景 |
| --- | --- | --- |
| REQUIRED | 有则加入，无则新建（默认） | 绝大多数业务方法 |
| REQUIRES_NEW | 挂起当前事务，新建独立事务 | 日志记录，需独立提交 |
| NESTED | 在当前事务中嵌套子事务（保存点） | 部分失败可回滚局部 |
| SUPPORTS | 有事务则加入，无则非事务运行 | 查询方法 |
| NOT_SUPPORTED | 挂起事务，以非事务方式执行 | 不需要事务的批量处理 |
| MANDATORY | 必须在事务中，否则抛异常 | 强约束的写操作 |
| NEVER | 必须非事务，有事务则抛异常 | 明确禁止事务的操作 |

**REQUIRED** 是默认且最常用：外层有事务就共用，外层没有就自己开一个。

**REQUIRES_NEW** 会真正挂起外层事务，开启一个全新的事务，两者互不干扰。外层回滚不会影响内层，内层回滚也不会（默认）导致外层回滚。

**NESTED** 与 REQUIRES_NEW 不同，它依赖外层事务的“保存点（savepoint）”，子事务回滚只回滚到保存点，外层可继续执行；但若外层回滚，子事务也会一起回滚。注意 NESTED 需要数据库支持 JDBC 保存点。

## 三、隔离级别

通过 `isolation` 属性设置，对应数据库标准隔离级别：`READ_UNCOMMITTED`、`READ_COMMITTED`（多数库默认）、`REPEATABLE_READ`（MySQL InnoDB 默认）、`SERIALIZABLE`。级别越高越安全但并发越差。

## 四、rollbackFor 的默认规则

`@Transactional` 默认**只在抛出 `RuntimeException` 和 `Error` 时回滚**，受检异常（`Exception` 的非运行时子类，如 `IOException`）不会触发回滚。如果你的方法声明 throws 受检异常，务必显式配置：

```java
@Transactional(rollbackFor = Exception.class)
public void process() throws BusinessException {
    // 任何 Exception 都回滚
}
```

## 五、REQUIRES_NEW 实战：日志不随主事务回滚

下面的例子中，主事务可能因业务异常回滚，但审计日志必须落库，不能丢失：

```java
@Service
public class OrderService {

    @Autowired
    private AuditLogService auditLogService;

    @Transactional
    public void createOrder(Order order) {
        orderDao.insert(order);
        // 日志用独立事务，主事务回滚也不影响它
        auditLogService.log("创建订单：" + order.getId());
        if (order.getAmount().compareTo(BigDecimal.ZERO) < 0) {
            throw new IllegalArgumentException("金额非法，主事务回滚");
        }
    }
}

@Service
public class AuditLogService {

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void log(String content) {
        auditDao.insert(new AuditLog(content));
    }
}
```

调用 `createOrder` 抛出异常时，`order` 的插入被回滚，但 `auditLogService.log` 因为 `REQUIRES_NEW` 已经独立提交，日志依然保留。

## 六、@Transactional 失效场景（重点）

**场景 1：方法不是 public。** Spring 的 AOP 代理默认只对 public 方法做事务增强（CGLIB 在部分版本也受限）。非 public 方法加注解无效。

**场景 2：同类自调用。** 和 AOP 一样，类内部 `this.method()` 调用绕过了代理，事务不生效。

**场景 3：异常被 catch 吞掉。** 方法内部把异常 catch 住且未重新抛出，代理认为“正常返回”，于是提交而非回滚。

**场景 4：抛出的异常不在 rollbackFor 范围内。** 抛了受检异常但没配 `rollbackFor`，不会回滚。

**场景 5：数据库引擎不支持事务。** 例如 MySQL 使用 MyISAM 引擎，本身不支持事务，注解写了也没用，需改用 InnoDB。

**场景 6：多线程调用。** 事务信息保存在当前线程的 `ThreadLocal` 中，子线程无法继承父线程的事务上下文，跨线程的事务互不关联。

```java
@Service
public class BugService {

    @Transactional
    public void wrong() {
        try {
            doUpdate();          // 自调用，事务失效
            int i = 1 / 0;
        } catch (Exception e) {
            // 异常被吞，不会回滚
            log.error("error", e);
        }
    }

    @Transactional
    public void doUpdate() {
        dao.insert(...);
    }
}
```

## 实际开发中的应用 / 常见问题

**问题 1：大事务导致锁等待超时？** 事务方法里不要包含远程调用、文件 IO 等耗时操作，尽量缩小事务边界，只把必须的数据库操作放进 `@Transactional`。

**问题 2：只读查询要加事务吗？** 可以加 `@Transactional(readOnly = true)`，让数据库连接走只读模式，某些数据库和 ORM（如 JPA/Hibernate）能借此做优化。

**问题 3：事务超时怎么设？** 用 `@Transactional(timeout = 3)` 设置秒级超时，超过则抛异常回滚，防止长事务拖垮数据库。

**问题 4：如何排查事务是否真的开启？** 开启 `logging.level.org.springframework.transaction=DEBUG`，观察日志中 `Creating new transaction` / `Participating in existing transaction` 等输出，可确认传播行为是否符合预期。
