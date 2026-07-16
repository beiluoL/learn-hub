---
title: 线程基础：创建方式、生命周期与 wait/notify、ThreadLocal
category: java
level: beginner
readMinutes: 18
order: 23
tags: "线程, 生命周期, 通信, ThreadLocal"
summary: 从线程的创建、状态流转到线程间通信与 ThreadLocal 原理。
prereq: java/java-basics
---

## 一、什么是线程

线程是进程内可独立调度的最小执行单元，多个线程共享同一进程的内存空间（堆、方法区），但各自拥有独立的程序计数器、虚拟机栈和本地方法栈。相比多进程，多线程通信成本低（直接读写共享变量），但也需要小心数据竞争。

Java 程序启动时至少有一条主线程（`main` 方法所在），之后可以创建更多线程并行工作。

## 二、三种创建线程的方式

**方式一：继承 Thread，重写 run()**

```java
class MyThread extends Thread {
    @Override
    public void run() {
        System.out.println("线程名：" + Thread.currentThread().getName());
    }
}
// 启动
new MyThread().start();
```

缺点：Java 单继承，继承了 Thread 就不能再继承别的类；且任务与线程本身耦合。

**方式二：实现 Runnable（推荐）**

```java
Runnable task = () -> System.out.println("通过 Runnable 执行");
new Thread(task, "工作线程").start();
```

任务（`Runnable`）与线程（`Thread`）解耦，可复用、可提交给线程池，是最常用的方式。

**方式三：实现 Callable + Future（有返回值）**

```java
Callable<Integer> callable = () -> {
    Thread.sleep(1000);
    return 42;
};
FutureTask<Integer> future = new FutureTask<>(callable);
new Thread(future).start();
Integer result = future.get();   // 阻塞直到拿到返回值
System.out.println("结果=" + result);
```

`Callable` 能返回结果并抛出异常，`Future`/`FutureTask` 用于获取异步结果，是线程池提交任务的标准方式。

**start() 与 run() 的区别**：调用 `run()` 只是在当前线程同步执行方法体，没有新建线程；调用 `start()` 才会向 JVM 申请真正启动一条新线程，再由新线程去执行 `run()`。永远用 `start()` 来启动线程。

## 三、线程的六种状态

Java 线程在 `Thread.State` 中定义了六种状态：

- **NEW**：已创建但未调用 `start()`。
- **RUNNABLE**：正在运行或就绪等待 CPU 调度（含操作系统层面的 running 和 ready）。
- **BLOCKED**：等待进入 `synchronized` 同步块/方法（被别人持有锁挡住）。
- **WAITING**：无限期等待，需其他线程显式唤醒，如 `wait()`、`join()`、`LockSupport.park()`。
- **TIMED_WAITING**：带超时的等待，如 `sleep(ms)`、`wait(ms)`、`join(ms)`。
- **TERMINATED**：执行完毕。

**状态流转要点**：

- `BLOCKED` 只与 `synchronized` 锁竞争有关；`WAITING`/`TIMED_WAITING` 是主动等待。
- `Thread.sleep()` 不释放锁，只是让出 CPU；`Object.wait()` 会释放持有的锁。
- `wait()` 之后必须由别的线程 `notify()`/`notifyAll()` 或超时才能回到 `RUNNABLE`。

## 四、线程间通信：wait / notify

`wait()`、`notify()`、`notifyAll()` 定义在 `Object` 上，必须**在 `synchronized` 同步块内调用**，否则抛 `IllegalMonitorStateException`。

```java
final Object lock = new Object();
boolean ready = false;

// 等待方
new Thread(() -> {
    synchronized (lock) {
        while (!ready) {        // 必须用 while，防止虚假唤醒
            try { lock.wait(); } catch (InterruptedException e) {}
        }
        System.out.println("被唤醒，开始工作");
    }
}).start();

// 通知方
new Thread(() -> {
    synchronized (lock) {
        ready = true;
        lock.notifyAll();        // 唤醒所有等待线程
    }
}).start();
```

**为什么用 while 而不是 if**：操作系统可能发生“虚假唤醒”（spurious wakeup），即没有 `notify` 也被唤醒。用 `while` 循环重新检查条件，可确保被唤醒时条件确实满足。这是并发编程的经典防坑写法。

## 五、ThreadLocal 原理与内存泄漏

`ThreadLocal` 提供“线程私有变量”，每个线程读写自己的副本，互不干扰。常用于保存请求上下文、数据库连接、用户身份等。

```java
private static final ThreadLocal<Integer> context = ThreadLocal.withInitial(() -> 0);

void demo() {
    context.set(100);                 // 当前线程存值
    Integer v = context.get();        // 只取当前线程的值
    System.out.println(v);            // 100
    context.remove();                 // 用完清理，避免内存泄漏
}
```

**底层结构**：每个 `Thread` 内部有一个 `ThreadLocalMap`，key 是 `ThreadLocal` 对象本身（**弱引用**），value 是你要存的值（强引用）。

**内存泄漏风险**：当 `ThreadLocal` 对象因为外部不再引用而被 GC 回收后，key 变成 null，但 value 仍被强引用，若线程长期存活（如线程池中的核心线程），这个 value 永远无法被访问也回收不掉，造成泄漏。**解决办法**是每次用完后调用 `remove()` 清理。

## 六、实际开发中的应用与常见问题

- **优先用 Runnable / Callable**：任务与线程解耦，方便交给线程池；避免继承 Thread 带来的单继承限制。
- **不要用 stop() / suspend()**：这些方法已废弃，会破坏锁与原子性，强制终止可能导致状态不一致；应靠中断（`interrupt()`）配合退出标志协作停止。
- **wait 必须配 while + synchronized**：忘记同步块会抛异常；用 if 判断条件可能遭遇虚假唤醒导致逻辑错误。
- **线程池场景下务必 remove ThreadLocal**：线程池线程会被复用，若不 `remove`，下一个任务可能读到上一个任务残留的“脏数据”，且造成内存泄漏。
- **区分 sleep 与 wait**：`sleep` 抱着锁睡觉，`wait` 会释放锁；排查死锁时这两者的差异很关键。
