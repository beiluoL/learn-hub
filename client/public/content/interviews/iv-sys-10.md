---
question: 线上突然 CPU 飙高到 100% 或 OOM，你的完整排查思路是什么？
category: system
difficulty: hard
tags: "线上排障, CPU, OOM, 排查思路, jstack, Arthas"
order: 52
---

线上排障的核心是**建立条件反射式的排查路径**，而不是东一榔头西一棒子。CPU 飙高和 OOM 的排查路径是两道经典考题，考察的是候选人是否真的在生产环境中处理过这些问题，以及是否有系统化的排障思维——止血→定位→修复→复盘的四步法。

## CPU 飙高 100%：完整排查链路

### 典型场景

监控告警: 某台机器 CPU usage 100%，持续 5 分钟。服务响应超时率上升。用户投诉"页面打不开"。

### 第一步：止血（30 秒内）

```bash
# 1. 确认问题确实在该机器上
ssh production-server-05
top -bn1 | head -20

# 2. 如果该机器已经有大量请求积压，先摘流量
# K8s 场景: kubectl cordon <node> / kubectl drain <node>
# 非 K8s: 从 LB upstream 中移除

# 3. 如果问题严重且扩大，考虑回滚上一版本
# git log --oneline -5 → kubectl rollout undo deployment/xxx
```

**黄金法则**: 先保用户可用，再找原因。不要在用户受影响的时候慢慢排查。

### 第二步：定位问题线程（标准流程）

```bash
# 1. 找到 Java 进程 PID
top -H -p <PID>  # -H 显示线程

# 输出示例:
# PID   USER  %CPU  COMMAND
# 12345 app   98.5  java
# 12456 app   95.2  java  ← 这两个线程占用最高
```

```bash
# 2. 线程 PID 转十六进制
printf "%x\n" 12456
# 输出: 30a8
```

```bash
# 3. jstack dump 线程栈，搜索十六进制 PID
jstack 12345 > /tmp/jstack_dump.txt
grep -A 30 "0x30a8" /tmp/jstack_dump.txt
```

```bash
# 4. 或者一步到位
jstack <PID> | grep -A 30 $(printf "0x%x" 12456)
```

```java
// 可能的输出（高 CPU 线程栈）:
"http-nio-8080-exec-15" #42 daemon prio=5 tid=0x00007f8a3c123000 nid=0x30a8 runnable
    at com.example.service.ReportService.generateReport(ReportService.java:87)
    at com.example.service.ReportService.lambda$batchGenerate$0(ReportService.java:120)
    // 定位到 ReportService.java:87，死循环或复杂计算的源头
```

### 第三步：用 Arthas 快速定位（更推荐）

Arthas 是阿里开源的 Java 诊断工具，**无侵入、无需重启**:

```bash
# 安装并启动 Arthas
curl -O https://arthas.aliyun.com/arthas-boot.jar
java -jar arthas-boot.jar

# 选择目标 Java 进程
[1]  12345  com.example.MainApplication
```

**一键定位 CPU TOP 线程**:
```bash
# Arthas 命令
thread -n 3  # 显示 CPU 占用 top 3 的线程，直接到代码行
```

输出:
```
"http-nio-8080-exec-15" Id=42 cpuUsage=95% RUNNABLE
    at com.example.service.ReportService.generateReport(ReportService.java:87)
    at com.example.controller.ReportController.getReport(ReportController.java:45)

# 直接告诉你哪个方法在消耗 CPU，不需要 jstack + grep 手动查
```

**其他 Arthas 排查利器**:
```bash
# 查看方法调用耗时
trace com.example.service.ReportService generateReport -n 5

# 反编译查看当前运行的代码（确认线上代码是否最新）
jad com.example.service.ReportService

# 查看方法参数和返回值
watch com.example.service.OrderService createOrder '{params, returnObj}' -x 3

# 在线修改日志级别（不重启）
logger --name com.example.service --level DEBUG

# 查看 JVM 实时状态
dashboard
```

### CPU 飙高的常见根因

| 原因 | 典型特征 | 排查手段 |
|---|---|---|
| 死循环 / 无限递归 | 1-2 个线程 CPU 100% | thread -b / jstack 看线程栈 |
| 频繁 Full GC | 所有线程间歇性飙高，GC 日志频繁 | jstat -gcutil / GC 日志分析 |
| 大量正则匹配 | 正则回溯导致 CPU 飙升 | jstack 找到正则调用栈 |
| JSON 序列化大对象 | 序列化耗时，内存暴涨 | Arthas trace 看方法耗时 |
| 高并发 + 锁竞争 | 大量 BLOCKED 线程 | jstack \| grep BLOCKED \| wc -l |
| 下游超时雪崩 | 线程池满载，请求排队 | thread --state / 连接池监控 |

## OOM 排查：完整链路

### 症状

应用频繁重启 / 内存使用率持续上升 / `OutOfMemoryError: Java heap space` / 服务无响应。

### 第一步：紧急采集现场

```bash
# JVM 参数设置（必须提前配置）
-XX:+HeapDumpOnOutOfMemoryError       # OOM 时自动 dump
-XX:HeapDumpPath=/data/dump/          # dump 文件路径
-XX:+ExitOnOutOfMemoryError           # OOM 后自动退出（让 K8s 重启）

# 手动 dump（服务还活着时）
jmap -dump:format=b,file=/tmp/heap_dump.hprof <PID>

# 如果 jmap 太慢（大堆内存），用 gcore + jmap 分离式 dump
gcore -o /tmp/core <PID>
jmap -dump:format=b,file=/tmp/heap_dump.hprof /usr/bin/java /tmp/core.xxx
```

### 第二步：MAT 分析内存泄漏

使用 Eclipse Memory Analyzer (MAT) 打开 hprof 文件:

**Leak Suspects Report**（泄漏嫌疑报告）——自动分析:
```
Problem Suspect 1:
  One instance of "com.example.service.CacheManager" loaded by 
  "sun.misc.Launcher$AppClassLoader" occupies 1,234,567,890 (78.56%) bytes.
  The memory is accumulated in one instance of 
  "java.util.concurrent.ConcurrentHashMap$Node[]" loaded by ...
```

**Dominator Tree**（支配树）——手动分析:
```
Class Name                          | Shallow Heap | Retained Heap
---------------------------------------------------------------
com.example.cache.LocalCache @ 0x1a |          80B | 1,200,000,000B (78%)
java.util.HashMap @ 0x2b            |          48B |   800,000,000B (52%)
  → Entry[1000000]                  |               |
byte[]                              |          16B |   500,000,000B (32%)
```

**解读**: `LocalCache` 的一个 HashMap 持有 100 万个 Entry，占 800MB——显然没有设置淘汰策略。

### OOM 常见类型与根因

```
java.lang.OutOfMemoryError: Java heap space
→ 堆内存泄漏或分配过大
→ MAT 看 Retained Heap top 对象

java.lang.OutOfMemoryError: GC overhead limit exceeded
→ GC 耗时超过 98% 但回收不到 2% 内存
→ 堆快满了，但对象都在用（不是泄漏，是容量不够）

java.lang.OutOfMemoryError: Metaspace
→ 类加载过多（动态代理/CGLIB/Groovy 脚本）
→ -XX:MaxMetaspaceSize 调大 + 排查类加载泄漏

java.lang.OutOfMemoryError: Direct buffer memory
→ 堆外内存耗尽（NIO/Netty 未释放 ByteBuffer）
→ 检查 -XX:MaxDirectMemorySize + Netty 内存泄漏检测

java.lang.OutOfMemoryError: unable to create new native thread
→ 线程数超过系统限制
→ 检查线程池是否有泄漏（创建了不回收）
```

### 第三步：堆外内存泄漏排查

堆外内存（Direct Memory）不会出现在 Heap Dump 中:

```bash
# 1. 查看进程实际内存 vs JVM 堆
ps aux | grep java
# RSS: 5GB, 但 -Xmx 设置 2GB → 3GB 在堆外

# 2. 检查 Metaspace
jstat -gc <PID>
# MU (Metaspace Used) 如果持续增长 → 类加载泄漏

# 3. 检查线程数
jstack <PID> | grep "^\"" | wc -l
# 如果线程数 > 2000 → 线程泄漏

# 4. 检查直接内存和内存映射
jcmd <PID> VM.native_memory summary
# - Internal (direct buffer): 看到 Direct ByteBuffer 使用量
```

## 应急三扳斧

无论什么原因，线上故障先执行三件事:

| 优先级 | 操作 | 适用场景 | 耗时 |
|---|---|---|---|
| 1 | 回滚 | 刚发版的故障 | 1-2 min |
| 2 | 扩容 | 流量突增 | 2-5 min |
| 3 | 限流 | 下游故障导致雪崩 | 运营配置秒级生效 |

**为什么"回滚"永远是第一选择**: 因为你知道上一个版本是稳定的。排查需要时间，而用户不愿等。

## 必须要做的 JVM 参数配置

```bash
# 生产环境必须加的 JVM 参数
java \
  -Xms4g -Xmx4g \                          # 堆内存（建议 Xms=Xmx 避免扩容开销）
  -XX:+UseG1GC \                           # 使用 G1 GC（大堆推荐）
  -XX:MaxGCPauseMillis=200 \               # GC 暂停目标
  -XX:+HeapDumpOnOutOfMemoryError \        # OOM 自动 dump
  -XX:HeapDumpPath=/data/logs/heap_dump/ \ # dump 路径
  -XX:+ExitOnOutOfMemoryError \            # OOM 自动退出
  -XX:+PrintGCDetails \                    # GC 日志（JDK8）
  -Xlog:gc*:/data/logs/gc.log \           # GC 日志（JDK11+）
  -XX:ErrorFile=/data/logs/hs_err_pid%p.log \ # JVM crash 日志
  -jar application.jar
```

## 面试追问

- **"jstack 和 Arthas 在执行时会影响线上服务吗？"** jstack 会触发安全点（Safepoint），如果刚好在 Full GC 执行 jstack 会卡住等待。Arthas 的 `thread -n` 对业务影响较小，但 `jad`（反编译）和 `redefine`（热部署）有风险。生产环境 Arthas 诊断完成后建议 `stop` 退出 Agent。
- **"Heap Dump 文件太大，本地打不开怎么办？"** MAT 可配置更大的堆内存打开大 dump（`MemoryAnalyzer.exe -vmargs -Xmx8g`）。如果仍然太大（>10GB），使用 `jhat` 在线查看，或者用 `jmap -histo:live` 先看类直方图——不需要完整 dump 就能看到哪些类占内存最多。
- **"没有提前配置 OOM 自动 dump，服务挂了后才想起怎么办？"** 如果服务已经 OOM 退出，看是否有 JVM crash 日志（`hs_err_pid.log` 在启动目录下）。如果配置了 Kubernetes，看 Pod 事件（`kubectl describe pod` 能看到 OOMKilled）。下次务必加上 `-XX:+HeapDumpOnOutOfMemoryError`。
- **"CPU 飙高但 jstack 看不到异常线程怎么办？"** 可能是 GC 线程占满 CPU（频繁 Full GC）→ 查 GC 日志；可能是 JIT 编译线程 → 查编译日志；可能是系统调用开销 → 用 `perf top` / `strace -c` 看系统级 CPU 消耗。Java 层面看不到就用系统工具往下查。
