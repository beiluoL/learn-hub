---
title: JVM 问题排查实战：OOM、CPU 飙高与诊断工具
category: java
level: advanced
readMinutes: 20
tags: "排障, OOM, jstack, jmap, Arthas"
summary: 用 jstack/jmap/Arthas 实战排查内存与 CPU 问题。
order: 46
prereq: java/java-jvm-gc-deep
---

## 一、常用命令行工具

JDK 自带一套诊断命令，位于 `JAVA_HOME/bin`：

-   **jps**：列出正在运行的 Java 进程及 PID，排障第一步先拿到 PID。
-   **jstat**：监控 GC 与类加载统计，如 `jstat -gcutil <pid> 1000` 每秒看各代使用率。
-   **jinfo**：查看和修改运行中 JVM 参数（`jinfo -flags <pid>`）。
-   **jmap**：生成堆转储快照 `jmap -dump:format=b,file=/tmp/dump.hprof <pid>`，或 `jmap -histo` 看对象直方图（哪些类占内存最多）。
-   **jstack**：打印线程栈，用于排查死锁、CPU 飙高、线程阻塞。
-   **jhat**：简易堆分析服务器（已过时，建议用 MAT / VisualVM）。

## 二、排查 CPU 飙高

典型现象：接口响应变慢，服务器 load 飙升。排查链路：

1.  `top` 找到 CPU 占用最高的 Java 进程 PID。
2.  `top -Hp <pid>` 找到该进程内最耗 CPU 的线程 TID（十进制）。
3.  `printf "%x\n" <tid>` 把线程 ID 转成十六进制（nid）。
4.  `jstack <pid> | grep -A 30 <nid>` 在栈里定位到具体线程栈，看它卡在哪段代码（常见是死循环、频繁 GC、正则回溯、锁竞争）。

```bash
top                       # 找 java 进程 PID，假设 12345
top -Hp 12345             # 找高 CPU 线程 TID，假设 12399
printf "%x\n" 12399       # 输出 306f
jstack 12345 | grep -A 30 'nid=0x306f'   # 定位到具体方法的线程栈
```

若线程大量在 GC 线程上，说明是内存/GC 问题而非业务代码；若在某业务方法空转，说明有死循环或热点计算。

## 三、排查 OOM 与内存泄漏

当发生 `java.lang.OutOfMemoryError`，要定位“谁占了内存”：

1.  启动时加 `-XX:+HeapDumpOnOutOfMemoryError -XX:HeapDumpPath=/tmp/heap.hprof`，OOM 瞬间自动生成堆转储。
2.  也可用 `jmap -dump:format=b,file=/tmp/heap.hprof <pid>` 主动抓取（对运行中有短暂停顿）。
3.  用 **MAT（Memory Analyzer）** 或 VisualVM 打开 hprof，看 **Dominator Tree（支配树）** 找占用最大的对象，顺着引用链找到被谁持有（如静态 Map 不断 put 不 remove，导致集合无限增长）。
4.  `jmap -histo:live <pid>` 可快速看存活对象排名，定位异常的大对象类型。

## 四、Arthas 在线诊断

**Arthas**（阿尔萨斯，阿里开源）是运行时诊断神器，无需重启、无需改代码：

-   `dashboard`：实时面板，看线程、内存、GC 概览。
-   `thread`：列出线程，加 `-n 3` 看最忙的 3 个线程；`thread <id>` 看具体栈。
-   `jad <类名>`：反编译线上 class，确认部署的代码是否真的是你以为的那版。
-   `watch <类> <方法> '{params,returnObj}'`：不埋点就能观察方法入参和返回值。
-   `trace <类> <方法>`：统计方法内部各调用链耗时，定位慢点。

```bash
# 启动 arthas 并 attach 到目标进程
java -jar arthas-boot.jar
# 进入后常用命令
dashboard            # 总览
thread -n 3         # 最忙的 3 个线程
jad com.demo.OrderService   # 反编译确认线上代码
watch com.demo.OrderService createOrder '{params,returnObj}' -x 3  # 观察调用
```

## 五、GC 频繁排查

GC 频繁会抢走 CPU、拉长停顿。步骤：

1.  `jstat -gcutil <pid> 1000` 看 YGC/YGCT、FGC/FGCT 频率与耗时。
2.  若 Young GC 极频繁且回收后 Eden 很快满，多半是分配速率太高或 Eden 太小，考虑加大新生代。
3.  若 Full GC 频繁，先用 `jmap -histo` 找大对象，排查内存泄漏。
4.  结合 GC 日志（`-Xlog:gc*`）看每次停顿时长，判断是否要换 G1/ZGC 或调 `-XX:MaxGCPauseMillis`。

## 六、制造内存泄漏演示排查

下面这段程序不断往静态 Map 塞数据且不清理，是典型的“隐式内存泄漏”，可用上述工具复现和定位：

```java
import java.util.HashMap;
import java.util.Map;

public class MemoryLeakDemo {
    // 静态 Map 始终被 GC Roots（类的静态字段）引用，不会被回收
    private static final Map<String, byte[]> LEAK = new HashMap<>();

    public static void main(String[] args) throws InterruptedException {
        int i = 0;
        while (true) {
            // 每次放 1MB，key 不重复，Map 无限增长
            LEAK.put("key-" + i, new byte[1024 * 1024]);
            i++;
            Thread.sleep(20);
            if (i % 100 == 0) {
                System.out.println("已放入 " + i + " MB，Map 还在增长");
            }
        }
    }
}
```

用 Arthas `dashboard` 会看到堆使用持续上涨；`jmap -histo | head` 会看到大量 `byte[]`；MAT 打开堆转储，支配树直接指向 `MemoryLeakDemo.LEAK` 这个静态 Map——泄漏点一目了然。

## 实际开发中的应用

-   **生产必备参数**：`-XX:+HeapDumpOnOutOfMemoryError -XX:HeapDumpPath=/data/logs/ -Xlog:gc*:file=/data/logs/gc.log`，让问题发生时自动留证。
-   **应急三板斧**：CPU 高用 `top -Hp` + `jstack`；内存高用 `jmap -histo` + 堆转储 + MAT；想知道线上代码用 `arthas jad`。
-   **死锁定位**：`jstack <pid>` 直接输出 `Found one Java-level deadlock`，列出互相等待的锁。

**常见误区**：

-   只重启不查根因，问题周期性复现。
-   在容器里没设 `-Xmx`，JVM 按宿主机内存算堆，超出容器限额被 OOM Killer 杀掉。
-   不敢用 `jmap -dump`，怕停顿——其实短暂停顿远小于一次 Full GC，该抓就抓。
