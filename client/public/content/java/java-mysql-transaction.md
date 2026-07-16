---
title: MySQL 事务与 MVCC：隔离级别与 undo/redo 日志
category: java
level: advanced
readMinutes: 22
order: 51
tags: "MySQL, 事务, MVCC, 隔离级别, 日志"
summary: 详解四种隔离级别、MVCC 实现与 undo/redo 日志作用。
prereq: java/java-mysql-index
---

## 事务与 ACID

**事务（Transaction）** 是一组要么全部成功、要么全部失败的操作。MySQL 用 ACID 来定义事务的可靠性：

- **原子性（Atomicity）**：事务内的操作不可分割，要么都做，要么都不做，靠 undo log 实现回滚。
- **一致性（Consistency）**：事务执行前后，数据库从一种合法状态变到另一种合法状态（如转账前后总金额不变），由应用逻辑 + 原子性 + 隔离性 + 持久性共同保证。
- **隔离性（Isolation）**：并发事务之间互不干扰，靠 MVCC 和锁实现。
- **持久性（Durability）**：一旦事务提交，结果永久保存，靠 redo log 实现崩溃恢复。

## 四种隔离级别与三大并发问题

SQL 标准定义了四种隔离级别，用以权衡性能与一致性：

| 隔离级别 | 脏读 | 不可重复读 | 幻读 |
| --- | --- | --- | --- |
| Read Uncommitted（读未提交） | 可能 | 可能 | 可能 |
| Read Committed（读已提交，RC） | 不会 | 可能 | 可能 |
| Repeatable Read（可重复读，RR，MySQL 默认） | 不会 | 不会 | 不会（靠 Next-Key Lock） |
| Serializable（串行化） | 不会 | 不会 | 不会 |

**脏读**：事务 A 读到了事务 B 尚未提交的数据，B 之后回滚，A 读到的就是"脏"的。
**不可重复读**：事务 A 两次读取同一行，期间事务 B 修改并提交了该行，导致 A 两次读到不同结果（侧重**已提交的数据被改**）。
**幻读**：事务 A 按某条件查到 N 行，期间事务 B 插入了符合条件的新行并提交，A 再查变成 N+1 行（侧重**新增/删除行**）。

MySQL 的 InnoDB 在 RR 级别下，通过 MVCC 解决快照读的不可重复读和幻读，通过 Next-Key Lock（临键锁）解决当前读的幻读。

## MVCC 原理

**MVCC（Multi-Version Concurrency Control，多版本并发控制）** 的核心思想是：不加锁也能让读写互不阻塞——读读、读写都不冲突，只有写写冲突。

InnoDB 在每行记录上隐藏了几个字段：
- **DB_TRX_ID**：最近一次修改该行的事务 id。
- **DB_ROLL_PTR**：回滚指针，指向 undo log 中该行的上一个版本。
- **DB_ROW_ID**：隐藏行 id（无主键时用作聚簇索引）。

**undo log 版本链**：每次更新一行，旧版本会被写入 undo log，并通过 `DB_ROLL_PTR` 串成一个链表。因此一行数据在历史上可能存在多个版本。

**ReadView（读视图）**：事务在快照读时（普通 `SELECT`）会生成一个 ReadView，记录当前活跃（未提交）的事务 id 列表。判断某版本是否可见的规则是：从版本链头开始，若版本的 `DB_TRX_ID` 是"已提交且早于 ReadView 创建"的事务，则该版本可见；否则顺着指针找更早的版本。

在 **RR 级别**下，事务第一次快照读时生成 ReadView，之后整个事务都用这个 ReadView，所以无论别的事务怎么改，它看到的始终是自己开始时的快照，实现**可重复读**。在 **RC 级别**下，每次快照读都会重新生成 ReadView，所以能读到别的事务最新已提交的数据。

## 快照读与当前读

- **快照读（Snapshot Read）**：普通 `SELECT`，靠 MVCC 读历史版本，不加锁，性能高。
- **当前读（Current Read）**：`SELECT ... FOR UPDATE`、`SELECT ... LOCK IN SHARE MODE`、`UPDATE`、`DELETE`、`INSERT`，读取的是最新已提交版本并加锁，防止别人并发修改。

正因为当前读会加锁，RR 级别下 InnoDB 用 Next-Key Lock 在当前读时防止幻读。

## undo log 与 redo log、binlog

**undo log（回滚日志）**：记录数据被修改前的样子。两个作用：一是事务回滚时把数据还原；二是支撑 MVCC 版本链。事务提交后，undo log 不会立即删除，而是等没有其他事务需要这个版本时由后台 purge 线程清理。

**redo log（重做日志）**：InnoDB 特有，记录"某个数据页做了什么修改"。它采用 **WAL（Write-Ahead Logging）** 机制——数据修改先写内存（Buffer Pool）并记 redo log，再异步刷盘。这样即使数据库崩溃，重启后也能用 redo log 把已提交但未刷盘的数据恢复出来，保证**持久性**。redo log 是固定大小的循环写，性能高。

**binlog（二进制日志）**：MySQL Server 层日志，记录所有数据变更（逻辑日志，如"把某行某字段改成某值"），用于主从复制和时间点恢复。与 redo log 的区别：redo log 是引擎层、物理日志、循环写；binlog 是 Server 层、逻辑日志、追加写。

两阶段提交保证二者一致性：提交时先写 redo log（prepare 状态），再写 binlog，最后 redo log 置为 commit。崩溃恢复时，若 redo log 处于 prepare 且 binlog 完整，则提交；否则回滚。

## 代码示例：演示不可重复读

在两个终端（或两个连接）中演示 RC 与 RR 的差异。先建表：

```sql
CREATE TABLE `account` (
  `id` INT PRIMARY KEY,
  `balance` INT NOT NULL
) ENGINE=InnoDB;
INSERT INTO `account` VALUES (1, 100);
```

**连接 A**：

```sql
-- 设置隔离级别为读已提交
SET SESSION TRANSACTION ISOLATION LEVEL READ COMMITTED;
START TRANSACTION;
SELECT balance FROM account WHERE id = 1;  -- 第一次读，得到 100
-- 此时保持事务不提交，等待连接 B 修改并提交
SELECT balance FROM account WHERE id = 1;  -- 第二次读，RC 下会读到 200（不可重复读）
COMMIT;
```

**连接 B**（在 A 两次查询之间执行）：

```sql
START TRANSACTION;
UPDATE account SET balance = 200 WHERE id = 1;
COMMIT;  -- 提交后，连接 A 在 RC 级别下第二次读会看到 200
```

如果把连接 A 的隔离级别改为 `REPEATABLE READ`，第二次读仍然得到 100，因为整个事务使用的是开始时的 ReadView 快照。

通过 JDBC 设置隔离级别：

```java
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.ResultSet;
import java.sql.Statement;

public class IsolationDemo {
    public static void main(String[] args) throws Exception {
        Connection conn = DriverManager.getConnection(
            "jdbc:mysql://localhost:3306/test?useSSL=false", "root", "root");
        // 设置事务隔离级别为可重复读
        conn.setTransactionIsolation(Connection.TRANSACTION_REPEATABLE_READ);
        conn.setAutoCommit(false);

        Statement st = conn.createStatement();
        ResultSet rs = st.executeQuery("SELECT balance FROM account WHERE id = 1");
        if (rs.next()) {
            System.out.println("第一次读: " + rs.getInt("balance"));
        }
        // 业务处理... 期间其他事务已提交修改
        ResultSet rs2 = st.executeQuery("SELECT balance FROM account WHERE id = 1");
        if (rs2.next()) {
            System.out.println("第二次读: " + rs2.getInt("balance")); // 仍为原值
        }
        conn.commit();
        conn.close();
    }
}
```

## 长事务的危害

**长事务**指执行时间很长、长时间不提交的事务。它有三大危害：

1. **占用 undo log 空间**：MVCC 需要保留事务开始时的旧版本，长事务导致大量旧版本无法被 purge，undo log 膨胀，可能撑爆磁盘。
2. **锁资源长时间不释放**：长事务持有的锁会阻塞其他事务，甚至引发死锁。
3. **主从延迟**：大事务的 binlog 在从库重放耗时久，造成复制延迟。

建议：尽量把事务拆小、避免事务中包含远程调用（RPC/HTTP）、及时提交，并用 `SELECT * FROM information_schema.innodb_trx` 监控长事务。

## 实际开发中的应用 / 常见问题

**问题一：明明改了数据，另一个事务却读不到？**
先确认隔离级别。RR 下快照读读到的是事务开始时的快照，这是设计使然；如果需要读到最新值，要么在当前事务内自己改、要么用 `SELECT ... FOR UPDATE` 当前读（注意会加锁）。

**问题二：事务回滚了，数据却没还原？**
检查是否混用了非事务引擎（MyISAM 不支持事务）或在事务中执行了 DDL（MySQL 中 DDL 会隐式提交，导致前面语句无法回滚）。

**问题三：如何排查长事务？**
执行 `SELECT trx_id, trx_state, trx_started, trx_mysql_thread_id FROM information_schema.innodb_trx ORDER BY trx_started ASC;` 找到 `trx_started` 很早的事务，结合业务及时 kill 或优化代码。

**问题四：RC 和 RR 怎么选？**
互联网业务大多用 RC，因为锁更少、并发更好，且配合业务幂等也能接受。RR 是 MySQL 默认，适合强一致要求的报表/账务场景，但 Next-Key Lock 更容易引发锁等待，需要谨慎设计索引。
