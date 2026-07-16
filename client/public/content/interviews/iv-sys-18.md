---
question: Linux 下如何排查 CPU 飙高和内存泄漏？列出常用命令和场景。
category: system
difficulty: middle
tags: "Linux, 排查, CPU, 内存, jstack, top"
order: 73
---

## Linux 性能问题排查

**核心结论**：CPU 飙高遵循 `top → top -Hp → 十六进制线程号 → jstack` 链路定位到具体代码行；内存泄漏通过 `free → top(按内存排序) → jmap → MAT` 分析对象分布。排查的本质是逐层缩小范围，从系统到进程到线程到对象。

---

### CPU 飙高排查

**场景**：线上服务 CPU 占用突然飙升到 90%+，响应变慢。

**排查链路**：

```bash
# 第一步：找到 CPU 占用最高的进程（按 C 键按 CPU 排序）
top -c
# 输出示例：
# PID   USER  %CPU  %MEM  COMMAND
# 22134 java  95.2  8.3   java -jar app.jar
```

```bash
# 第二步：查看该进程中 CPU 最高的线程
top -Hp 22134
# 输出示例：
# PID    USER  %CPU  COMMAND
# 22152  java  94.8  java
```

```bash
# 第三步：将线程号转成十六进制
printf "%x\n" 22152
# 输出：5688
```

```bash
# 第四步：用 jstack 输出线程堆栈，搜索该十六进制线程号定位代码行
jstack 22134 | grep -A 30 "0x5688"
# 输出示例：
# "http-nio-8080-exec-7" #39 daemon prio=5 tid=0x00007f9f78001000 nid=0x5688 runnable
#   at com.example.service.ReportService.calculateSum(ReportService.java:42)
#   at com.example.controller.ReportController.getReport(ReportController.java:18)
```

**定位到**：ReportService.java 的第 42 行——`calculateSum` 方法可能陷入死循环或执行了无索引的全表扫描查询。

```bash
# 附：Arthas 快速定位（阿里开源诊断工具）
# 列出 CPU 最高的前 3 个线程，直接输出堆栈
curl -O https://arthas.aliyun.com/arthas-boot.jar
java -jar arthas-boot.jar
# 进入 Arthas 控制台后：
thread -n 3
# 直接打印：当前最忙的 3 个线程的调用栈
```

**常见 CPU 飙高原因**：

| 原因 | 表现 | 定位方式 |
|------|------|----------|
| 死循环 / 复杂计算 | 固定的线程 CPU 始终 100% | jstack 看 RUNNABLE 线程 |
| GC 频繁 | GC 线程 CPU 高，伴随内存波动 | `jstat -gcutil 1000` 观察 GC |
| 正则表达式回溯 | 正则计算 CPU 爆炸 | 检查 ReDos 攻击面 |
| 上游大量请求 | 线程数暴增，CPU 分布均匀 | 检查 QPS 监控 + 限流 |

---

### 内存泄漏排查

**场景**：应用运行几天后内存持续上涨，最终 OOM 重启。

```bash
# 第一步：查看系统整体内存
free -m
#        total  used   free   shared  buff/cache  available
# Mem:   15892  14520  412    156     960          892
# Swap:  2048   1856   192
# used 接近 total，Swap 也被大量使用 → 内存紧张

# 第二步：按内存占用排序进程
top -o %MEM
# 或
ps aux --sort=-%mem | head -10

# 第三步：查看进程内存分布的详细信息
pmap -x 22134 | sort -k3 -n -r | head -20
# 输出：虚拟地址空间各个区域的大小和 RSS（实际物理内存占用）
```

```bash
# 第四步：对 Java 进程，dump 堆内存
jmap -dump:live,format=b,file=/tmp/heap.hprof 22134

# 第五步：用 jmap 直接看直方图（对象类型 + 数量 + 占用大小）
jmap -histo:live 22134 | head -30
#  num   #instances      #bytes   class name
#    1:      500000     80000000   byte[]
#    2:      480000     46080000   com.example.model.Order
#    3:      100000     16000000   java.lang.String
# → 发现 Order 对象有 48 万个，怀疑缓存未设置上限或线程本地变量未清理
```

将 `heap.hprof` 文件下载到本地，使用 **MAT（Memory Analyzer Tool）** 或 IDEA Profiler 打开：
- Leak Suspects Report：自动识别可能泄漏的类。
- Dominator Tree：按对象占用内存排序，快速定位大对象。
- Path to GC Roots：追踪对象引用链，找到泄漏根因。

```python
# 第六步（Python 场景）：用 tracemalloc 追踪内存分配
import tracemalloc
tracemalloc.start()
# ... 运行代码 ...
snapshot = tracemalloc.take_snapshot()
top_stats = snapshot.statistics('lineno')
for stat in top_stats[:10]:
    print(stat)
# 输出：每个文件每行分配了多少内存，直接定位
```

---

### 磁盘 IO 问题

```bash
# 查看磁盘使用情况
df -h

# 查看某个目录下哪些子目录占用大
du -sh /var/log/* | sort -rh | head -10

# 查看磁盘 IO 实时状态
iostat -x 1
# %util 接近 100% → 磁盘瓶颈
# await 值过大 → IO 延迟高
# r/s w/s → 每秒读写请求数
```

---

### 网络问题

```bash
# 查看所有 TCP 连接状态分布
netstat -antp | awk '{print $6}' | sort | uniq -c | sort -n
# 输出示例：
#   12 ESTABLISHED
#   3  LISTEN
#   150 TIME_WAIT
# 大量 TIME_WAIT → 短连接问题（参考 TCP 面试题）

# 更快的替代（netstat 可能很慢）
ss -s
# Total: 350
# TCP:   320 (estab 180, closed 80, timewait 50)

# 抓包分析（特定接口、特定端口）
tcpdump -i eth0 port 8080 -w capture.pcap
# 下载 capture.pcap 用 Wireshark 分析

# 查看某个端口是否被占用
lsof -i:8080
```

---

### 场景化案例

**案例 1**：凌晨 3 点，监控告警 CPU 100%。

```bash
# 排查链路
top -c → 进程 PID 22134
top -Hp 22134 → 线程 PID 22155 CPU 99%
printf "%x\n" 22155 → 568b
jstack 22134 | grep -A 30 0x568b → CronJobService.buildReport()
```
**根因**：定时任务在全量扫描大表时触发大量内存分配，GC 频繁。**解决**：添加分页查询 + 游标。

**案例 2**：用户反馈页面偶尔 502，持续几秒后恢复。

```bash
dmesg | tail -20
# 输出：Out of memory: Kill process 22134 (java) score 752 or sacrifice child
# → Java 进程被 OOM Killer 杀死
grep -i "oom" /var/log/messages
# → 确认 OOM 事件时间
```
**根因**：用户上传大文件时服务端一次将整个文件读入内存做处理。**解决**：改用流式处理 + 限制上传大小。

---

### 面试官追问

**追问**：jstack 输出的线程状态有哪些？WAITING 和 BLOCKED 区别？

**回答**：RUNNABLE（运行中/就绪）、BLOCKED（等待获取 monitor 锁，被其他线程持有）、WAITING（Object.wait()/Thread.join()/LockSupport.park()，等待被其他线程唤醒）、TIMED_WAITING（带超时的等待，如 sleep/timeout wait）。BLOCKED 是被动等待锁释放——等别人放权；WAITING 是主动等待通知——等别人叫醒。

**追问**：为什么 jmap -dump:live 会触发 Full GC？

**回答**：`live` 参数要求只 dump 存活对象，jmap 执行前需要先触发一次 Full GC 来标记和清理所有不可达对象。生产环境慎用——Full GC 会导致所有应用线程暂停（STW），时间可能长达数十秒。替代方案：去掉 `live` 参数 dump 全量（包含死亡对象），或使用 `-XX:+HeapDumpOnOutOfMemoryError` 让 JVM 在 OOM 时自动生成 dump 而不需要手动 GC。
