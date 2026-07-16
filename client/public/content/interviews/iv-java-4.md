---
question: volatile 关键字的作用是什么？能保证原子性吗？
category: java
difficulty: hard
tags: 并发, volatile, JMM
order: 15
---

`volatile` 解决的是**可见性**和**有序性**，但**不保证原子性**。

**可见性：**一个线程对 volatile 变量的写，会立即刷新到主内存，其他线程读时从主内存重新加载，从而看到最新值。

**有序性：**volatile 通过插入内存屏障（Memory Barrier）禁止指令重排序，这也是双重检查锁单例里 `instance` 必须加 volatile 的原因——防止"分配内存→赋值引用→初始化对象"被重排导致拿到半成品对象。

**不保证原子性：**像 `count++` 这种复合操作（读-改-写三步），volatile 无能为力。多线程下仍会丢更新，需要用 `synchronized` 或 `AtomicInteger`。

```java
private volatile boolean running = true; // 适合：状态标志位

// 不适合：i++ 这类复合操作
private volatile int count = 0;
count++; // 仍有线程安全问题！应改用 AtomicInteger
```

**适用场景：**一写多读的状态标志、DCL 单例的实例引用。需要复合原子操作时用 `Atomic*` 类或锁。
