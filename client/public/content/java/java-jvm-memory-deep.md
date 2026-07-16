---
title: JVM 内存模型详解：运行时数据区与对象创建
category: java
level: intermediate
readMinutes: 20
tags: "JVM, 内存模型, 堆, 栈, 对象"
summary: 详解运行时数据区、对象创建过程与常见内存溢出。
order: 43
prereq: java/java-jvm
---

## 一、运行时数据区概览

Java 虚拟机在运行时会把内存划分为若干区域，各自用途和生命周期不同：

-   **堆（Heap）**：几乎所有对象实例和数组都在这里分配，是 GC 的主战场，线程共享，启动时由 `-Xms`/`-Xmx` 指定大小。
-   **方法区 / 元空间（Metaspace）**：存储已被加载的类信息、常量、静态变量、即时编译器编译后的代码。JDK 8 起方法区的实现由永久代（PermGen）改为元空间，使用本地内存，默认无上限（受物理内存限制），由 `-XX:MaxMetaspaceSize` 限制。
-   **虚拟机栈（JVM Stack）**：每个线程私有，生命周期与线程相同。每个方法调用会创建一个**栈帧（Stack Frame）**，存放局部变量表、操作数栈、动态链接、方法出口。方法递归过深会触发栈溢出。
-   **本地方法栈（Native Method Stack）**：为 Native（如 C/C++）方法服务，HotSpot 中与虚拟机栈合二为一。
-   **程序计数器（PC Register）**：线程私有，记录当前线程正在执行的字节码指令地址。唯一不会发生 OOM 的区域。

理解这些区域对排障至关重要：堆溢出是对象太多，栈溢出是调用太深，元空间溢出是类加载太多（常见于动态代理、热部署）。

## 二、堆的分代结构

HotSpot 把堆分为新生代和老年代，基于“弱分代假说”（绝大多数对象朝生夕死）：

-   **新生代（Young）**：新对象先分配到这里，分为一块 **Eden** 区和两块 **Survivor**（S0、S1）。大部分对象在 Eden 区一次 Minor GC 就被回收。
-   **Survivor 区**：Eden 存活对象复制到 S0，下次 GC 把 Eden+S0 存活对象复制到 S1，如此来回（复制算法），每熬过一次 GC 年龄 +1。
-   **老年代（Old）**：对象年龄达到阈值（默认 15，由 `-XX:MaxTenuringThreshold` 控制）或 Survivor 放不下的大对象，晋升到老年代。老年代用标记-整理/标记-清除，触发 Major/Full GC，停顿较长。

## 三、对象的创建过程

当执行 `new Object()` 时，JVM 内部大致经历五步：

1.  **类加载检查**：检查这个类的符号引用是否已被加载、解析、初始化；没有则先执行类加载。
2.  **分配内存**：在堆中划出一块空间。若堆规整用**指针碰撞（Bump the Pointer）**；若碎片化用**空闲列表（Free List）**。并发场景用 CAS 或本地线程分配缓冲（TLAB）保证线程安全。
3.  **初始化零值**：把分配的内存空间都置为 0（不含对象头），保证字段有默认零值（int=0、引用=null）。
4.  **设置对象头（Object Header）**：写入类元数据指针、哈希码、GC 分代年龄、锁状态等 Mark Word 信息。
5.  **执行 <init>**：调用构造函数，按代码真正给字段赋值。

注意：代码里 `new` 之后拿到的引用，第 3 步已保证字段是零值，第 5 步才执行你写的赋值逻辑。

## 四、对象的内存布局

一个 Java 对象在堆中的布局分三块：

-   **对象头（Header）**：含 Mark Word（哈希、锁、GC 年龄）和类型指针（指向类的元数据）。在 64 位 JVM 上，未压缩时对象头约 16 字节。
-   **实例数据（Instance Data）**：各字段的实际值，含父类继承的字段。按类型宽度对齐排列（long/double 8 字节，int 4 字节等）。
-   **对齐填充（Padding）**：HotSpot 要求对象大小是 8 字节的整数倍，不足则补齐。纯粹为了地址对齐，无实际数据。

**指针压缩（Compressed Oops）**：64 位 JVM 默认开启 `-XX:+UseCompressedOops`，用 32 位压缩指针表示对象引用，既省内存又保持性能，使得堆可超过 32GB 仍高效（超过约 32GB 时自动关闭，反而更耗内存）。

## 五、常见内存溢出示例

**1. Java 堆溢出（java.lang.OutOfMemoryError: Java heap space）**：对象无节制增长且无法回收。

```java
import java.util.ArrayList;
import java.util.List;

public class HeapOOM {
    static class OomObject {}
    public static void main(String[] args) {
        List<OomObject> list = new ArrayList<>();
        // 不断创建对象并持有引用，GC 无法回收，最终堆溢出
        while (true) {
            list.add(new OomObject());
        }
    }
}
```

**2. 元空间溢出（Metaspace）**：动态生成大量类（如 CGLIB 代理、Groovy 脚本）且不卸载。常见参数为 `-XX:MaxMetaspaceSize=64m`。

**3. 栈溢出（java.lang.StackOverflowError）**：方法无限递归。

```java
public class StackOverflow {
    // 没有终止条件的递归，每次调用新增一个栈帧，栈深度耗尽即报错
    public static void recurse() {
        recurse();
    }
    public static void main(String[] args) {
        recurse();
    }
}
```

栈深度受 `-Xss` 控制，调大可容纳更深调用，但线程数多了会占用更多内存。

## 实际开发中的应用

-   **调优堆大小**：根据对象存活特征设 `-Xms=-Xmx` 避免动态扩缩容抖动；新生代比例用 `-XX:NewRatio` 调整。
-   **排查 OOM**：加 `-XX:+HeapDumpOnOutOfMemoryError -XX:HeapDumpPath=/tmp/dump.hprof` 自动留存堆转储，用 MAT 分析谁占着大对象。
-   **避免栈溢出**：递归务必有终止条件，深度不确定时改循环或用尾递归思想；线程栈用 `-Xss` 合理设置。

**常见误区**：

-   以为 `=-Xmx` 设越大越好，结果 Full GC 停顿更长。
-   忽略元空间，动态代理类堆积导致 Metaspace OOM。
-   把大对象频繁创建在循环里，触发频繁 Young GC。
