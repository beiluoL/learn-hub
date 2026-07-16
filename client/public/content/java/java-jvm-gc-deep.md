---
title: 垃圾回收深度解析：算法、收集器 G1/ZGC 与调优
category: java
level: advanced
readMinutes: 24
tags: "GC, 垃圾回收, G1, ZGC, 调优"
summary: 对比 GC 算法与 Serial/CMS/G1/ZGC 收集器及调优参数。
order: 44
prereq: java/java-jvm-memory-deep
---

## 一、如何判断对象可回收

-   **引用计数法**：给对象加计数器，引用+1、失效-1，为 0 即可回收。简单但无法解决**循环引用**（A 引用 B、B 引用 A，但都不可达），主流 JVM 不用。
-   **可达性分析（Reachability Analysis）**：以 **GC Roots** 为起点向下搜索，能到达的对象存活，不可达的被回收。GC Roots 包括：虚拟机栈局部变量、方法区静态变量、常量、本地方法栈引用、已启动且未结束的线程等。

```java
// 循环引用示例：objA 与 objB 互相引用，但都不再被 GC Roots 引用
Object objA = new Object();  // 假设 objA 之后不再被任何根引用
Object objB = new Object();
// objA 与 objB 互相持有（伪代码示意），失去外部引用后可达性分析判定可回收
```

## 二、四种引用类型

-   **强引用（Strong）**：`Object o = new Object()`，只要强引用在，永不回收。OOM 也不回收。
-   **软引用（Soft）**：内存不足时才回收，适合做内存敏感的缓存（如图片缓存）。
-   **弱引用（Weak）**：下次 GC 必回收，常用于 WeakHashMap、ThreadLocal 防止内存泄漏。
-   **虚引用（Phantom）**：最弱，无法通过它获取对象，仅用于对象被回收时收到通知（管理堆外内存）。

## 三、垃圾回收算法

-   **标记-清除（Mark-Sweep）**：标记存活对象，清除未标记。优点简单，缺点产生内存碎片，大对象可能分配不上。
-   **标记-整理（Mark-Compact）**：标记后把存活对象向一端移动，清理边界外空间，无碎片但移动成本高。
-   **复制（Copying）**：把存活对象复制到另一块，清空原块。无碎片、效率高，但浪费一半空间。新生代的 Eden/Survivor 即用此思想（Eden:S0:S1 = 8:1:1）。
-   **分代收集**：综合上述——新生代用复制（对象死得快），老年代用标记-整理/清除（对象活得久）。

## 四、主流收集器对比

| 收集器 | 算法 | 并发 | 适用 |
| --- | --- | --- | --- |
| Serial | 单线程复制/标记整理 | 否 | 客户端、小内存 |
| Parallel（吞吐量优先） | 多线程复制/整理 | 否（STW 收集） | 后台计算、批处理 |
| CMS | 并发标记-清除 | 部分并发 | 老版本低延迟，已废弃 |
| G1 | 分 Region + SATB | 部分并发 | 服务端主流（JDK 9+ 默认） |
| ZGC | 着色指针 + 并发 | 几乎全并发 | 超低延迟（<10ms） |

**CMS 细节**：并发标记清除，分初始标记、并发标记、重新标记（Remark，STW 修正）、并发清除。优点是停顿短，缺点是并发清理产生碎片，且“Concurrent Mode Failure”会退化为 Serial 全停顿，JDK 14 已移除。

**G1 细节**：把堆切成很多大小相等的 **Region**，跟踪每个 Region 的回收价值（垃圾占比），优先回收价值高的（Garbage First 得名）。用 **SATB（Snapshot-At-The-Beginning）** 记录并发标记期间的变化，可预测停顿（`-XX:MaxGCPauseMillis` 设目标，G1 尽量满足）。大对象（Humongous）直接放专用 Region。

**ZGC 细节**：JDK 11 引入、JDK 15 生产可用。核心 **着色指针（Colored Pointers）** 把标记信息编码进对象指针的空闲位，**读屏障（Load Barrier）** 在访问对象时修正指针，使标记、 relocation（重定位）、清理几乎全与应用线程并发，停顿不随堆大小增长，TB 级堆也能稳定在 10ms 以内。

## 五、常用 JVM 参数

```bash
# 堆大小
-Xms2g -Xmx2g            # 初始与最大堆一致，避免动态扩缩容
-Xmn512m                 # 新生代大小（或直接用 NewRatio）
-XX:NewRatio=2           # 老年代:新生代 = 2:1
-Xss256k                 # 线程栈大小

# 选择收集器
-XX:+UseG1GC             # 使用 G1（JDK 9+ 默认）
-XX:+UseZGC              # 使用 ZGC（JDK 15+ 生产可用）
-XX:MaxGCPauseMillis=200 # G1 目标最大停顿

# 元空间与 OOM 诊断
-XX:MaxMetaspaceSize=256m
-XX:+HeapDumpOnOutOfMemoryError
-XX:HeapDumpPath=/tmp/dump.hprof
-Xlog:gc*:file=/tmp/gc.log:time,level,tags  # JDK 9+ 统一 GC 日志
```

## 六、GC 日志与观察

开启日志后能看到每次 GC 的类型、停顿时间、各代前后占用。关键看：

-   **Young GC 频率与耗时**：过频说明 Eden 太小或对象分配快。
-   **Full GC 频率**：频繁 Full GC 是性能杀手，多半是老年代压力大或内存泄漏。
-   **晋升失败（Promotion Failed）**：Survivor/老年代放不下，触发 Full GC。

下面这段程序持续创建大对象并长驻，配合上面的 G1 参数可观察老年代增长与 GC 行为：

```java
import java.util.ArrayList;
import java.util.List;

public class GcDemo {
    public static void main(String[] args) throws InterruptedException {
        List<byte[]> holder = new ArrayList<>();
        while (true) {
            // 每次分配 1MB，且持有引用不让回收，模拟老年代压力
            holder.add(new byte[1024 * 1024]);
            Thread.sleep(50);
            // 运行后用 jstat -gc <pid> 或观察 gc.log 看各区变化
            if (holder.size() % 100 == 0) {
                System.out.println("已分配 " + holder.size() + " MB");
            }
        }
    }
}
```

用 `jstat -gcutil <pid> 1000` 每秒打印各代使用率与 GC 次数，可直观看到 Young GC 与 Old 区增长。

## 实际开发中的应用

-   **服务端默认用 G1**，对延迟敏感（如交易网关、实时推荐）的 JDK 15+ 应用切到 ZGC。
-   **调优思路**：先定停顿目标，再给足够堆；不要盲目加 `-Xmx`。观察 GC 日志，若 Full GC 频繁先查内存泄漏（MAT 看大对象），再考虑调新生代比例。
-   **避免大对象**：超过 Region 一半的对象在 G1 中成为 Humongous，易触发并发周期，尽量拆分。

**常见误区**：

-   认为 GC 全自动无需关心，结果 Full GC 停顿几十秒拖垮接口。
-   把 `-Xmx` 设超物理内存，触发系统 swap，性能雪崩。
-   对象池滥用反加重 GC 负担（现代 GC 下短命对象很便宜）。
