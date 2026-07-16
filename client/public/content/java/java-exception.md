---
title: 异常处理：Checked、Unchecked 与最佳实践
category: java
level: beginner
readMinutes: 8
tags: 异常, 健壮性, try-catch
summary: 搞清 Checked / Unchecked 异常的区别，掌握 try-with-resources 与异常处理的工程实践。
order: 7
prereq: java/java-basics
---

# 异常处理：Checked、Unchecked 与最佳实践

Java 的异常体系以 `Throwable` 为根，分为 `Error`（系统级错误，不该捕获）和 `Exception`（程序可处理）两大分支。

## 一、异常分类

| 类型 | 是否强制处理 | 典型代表 | 说明 |
| --- | --- | --- | --- |
| Checked（受检） | 编译期强制 try/throws | `IOException`、`SQLException` | 可预见、可恢复的外部问题 |
| Unchecked（非受检） | 不强制 | `NullPointerException`、`IllegalArgumentException` | 多为编程 bug |
| Error | 不应捕获 | `OutOfMemoryError`、`StackOverflowError` | JVM 级严重错误 |

## 二、try-with-resources 自动关闭

任何实现了 `AutoCloseable` 的资源都能自动释放，避免忘记 `close()`：

```java
try (var reader = new BufferedReader(new FileReader("data.txt"))) {
    return reader.readLine();
} catch (IOException e) {
    log.error("读取失败", e);
    throw new UncheckedIOException(e);
}
```

## 三、最佳实践

- **不要吞异常**：`catch (Exception e) {}` 是灾难，至少要记录日志。
- **精确捕获**：优先捕获具体异常类型，而不是笼统的 `Exception`。
- **早抛出、晚捕获**：在能处理的层级统一处理，底层只管抛。
- **自定义业务异常**：继承 `RuntimeException`，携带错误码，便于全局处理。
- **不要用异常控制流程**：异常开销大，别拿它当 if 用。

```java
public class BizException extends RuntimeException {
    private final int code;
    public BizException(int code, String msg) {
        super(msg);
        this.code = code;
    }
    public int getCode() { return code; }
}
```

> 一句话：受检异常用于"调用方必须应对"的情况，其余用非受检异常；资源一律 try-with-resources。
