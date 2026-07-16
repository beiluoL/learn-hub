---
question: JVM 垃圾回收算法有哪些？CMS 和 G1 的区别和使用场景？
category: java
difficulty: hard
tags: "JVM, GC, CMS, G1, 垃圾回收, ZGC"
order: 26
---

## 核心结论

**回答**：JVM 垃圾回收算法可分为标记-清除（有碎片）、标记-整理（无碎片但性能开销大）、标记-复制（无碎片但浪费一半空间）三种基础算法，HotSpot 采用分代收集将不同算法组合使用。CMS 以低停顿为目标，适用于 JDK 8 的 4GB 以下堆；G1 以可预测停顿时间为目标，是 JDK 9+ 的默认收集器，适用于 4GB 以上的大堆。ZGC 进一步将停顿压缩到亚毫秒级，适合超大堆。

## 基础垃圾回收算法

### 标记-清除（Mark-Sweep）

```
标记阶段：从 GC Roots 出发，标记所有存活对象
清除阶段：遍历堆，回收未标记的对象
```

**特点**：最基本算法，不移动对象。但会产生内存碎片，可能导致大对象分配失败。

### 标记-整理（Mark-Compact）

```
标记阶段：同上
整理阶段：将所有存活对象向一端移动，直接清理边界外的内存
```

**特点**：无碎片，但移动对象需要更新引用，STW 时间长。适合老年代。

### 标记-复制（Mark-Copy）

```
将内存分为两块（From + To）
标记阶段：同上
复制阶段：将存活对象复制到 To 空间，清空 From 空间
```

**特点**：无碎片，吞吐量高，但浪费 50% 内存。适合新生代（对象死亡率高，实际浪费少）。HotSpot 的 Survivor 区采用 Eden:Survivor:Survivor = 8:1:1 的比例，只浪费 10%。

## 分代收集理论

| 特性 | 新生代（Young Gen） | 老年代（Old Gen） |
|------|---------------------|-------------------|
| 对象特征 | 朝生夕死，死亡率高 | 存活时间长 |
| 收集频率 | 频繁 | 较低 |
| 适用算法 | 标记-复制（效率高） | 标记-整理 / 标记-清除 |
| 典型收集器 | Serial / ParNew / Parallel Scavenge | CMS / Serial Old / Parallel Old |
| 回收名称 | Minor GC（Young GC） | Major GC / Full GC |

**对象晋升老年代的条件**：
1. 年龄阈值：每熬过一次 Minor GC 年龄+1，达到 `-XX:MaxTenuringThreshold=15` 后晋升
2. 动态年龄判断：Survivor 中同龄对象大小超过 Survivor 的 50%，该年龄及以上对象直接晋升
3. 大对象直接进入老年代：超过 `-XX:PretenureSizeThreshold` 的对象（默认 0，不启用）

## CMS（Concurrent Mark Sweep）

### CMS 的 7 个阶段

```
1. 初始标记（Initial Mark）      STW | 标记 GC Roots 直接引用 | 极短
2. 并发标记（Concurrent Mark）   并发 | 从 GC Roots 遍历对象图 | 耗时最长
3. 并发预清理（Concurrent Preclean） 并发 | 处理并发标记期间的引用变化
4. 可中断的并发预清理（Abortable Preclean） 并发 | 等待 Young GC
5. 重新标记（Remark）            STW | 处理并发阶段产生的增量变化 | 比初始标记长
6. 并发清除（Concurrent Sweep）  并发 | 清除未标记对象
7. 并发重置（Concurrent Reset）  并发 | 重置内部数据结构
```

### CMS 的三大缺陷

**1. 内存碎片**：基于标记-清除，老年代碎片化严重时触发 Serial Old（单线程 Full GC），停顿数秒。

**2. 浮动垃圾**：并发清除阶段产生的垃圾只能等到下一次 GC 回收。这些未回收对象称为"浮动垃圾"。

**3. Remark 的 STW**：重新标记阶段需要扫描整个新生代 + 老年代的 Card Table，时间是"初始标记 + 大部分并发标记时长"。

## G1（Garbage First）

### G1 的核心设计

G1 将堆划分为大小相同的 **Region**（默认 2048 个，1MB~32MB），每个 Region 可扮演 Eden/Survivor/Old/Humongous 角色。

```
┌─────────────────────────────────────────────────┐
│ E │ S │ O │ O │ E │ H │ O │ E │ ... │ Free │
└─────────────────────────────────────────────────┘
  Region 不是固定的，GC 时动态调整
```

### G1 的关键技术

**Remembered Set（RSet）**：每个 Region 维护一个 Remembered Set，记录"哪些 Region 引用了本 Region 中的对象"。GC 时无需扫描整个堆，只需扫描 RSet 中的 Region。

**SATB（Snapshot-At-The-Beginning）**：并发标记开始时对对象图拍快照，标记过程中新增的对象默认视为存活。通过 pre-write barrier 记录 SATB 队列中的引用变化，在最终标记（Remark）阶段处理。

**Mixed GC**：不仅回收新生代，还选择性地回收部分老年代 Region（根据 Region 的垃圾占比排序，优先回收垃圾最多的 Region — 这也是 Garbage First 名字的由来）。

### G1 的可预测停顿

```bash
-XX:MaxGCPauseMillis=200  # 目标：每次 GC 停顿不超过 200ms
```
G1 通过统计各 Region 的回收耗时，在目标停顿时间内只回收预估能完成的 Region，超过目标的 Region 留待下一次 Mixed GC。

## CMS vs G1 vs ZGC

| 维度 | CMS | G1 | ZGC |
|------|-----|----|-----|
| 算法 | 标记-清除 | 标记-整理（Region内） | 标记-整理 + 染色指针 |
| 堆结构 | 连续分代 | 离散 Region | 分区 |
| 停顿时间 | 几十~几百 ms | 可控（默认 200ms） | <1ms（亚毫秒） |
| 内存碎片 | 严重 | 无碎片 | 无碎片 |
| 适用堆大小 | < 4GB | 4~64GB | 超大堆（TB 级） |
| Full GC | Serial Old（单线程） | Serial Old（兜底） | 无传统 Full GC |
| JDK 默认 | JDK 8-（已废弃） | JDK 9+ | JDK 17+（实验性→生产） |
| 并发实现 | 增量更新 | SATB | 染色指针 |

## 常用 JVM 参数

```bash
# G1 推荐参数
-XX:+UseG1GC                          # 使用 G1
-XX:MaxGCPauseMillis=200              # 目标停顿
-XX:G1HeapRegionSize=8m               # Region 大小
-XX:InitiatingHeapOccupancyPercent=45 # 堆占用 45% 触发并发标记
-XX:+ParallelRefProcEnabled           # 并行处理引用
-XX:+DisableExplicitGC                # 禁用 System.gc()

# 通用 GC 日志
-Xlog:gc*:file=gc.log:time,level,tags # JDK 9+ 统一日志

# 堆大小
-Xms4g -Xmx4g                         # 初始与最大一致，避免动态扩缩
```

## 面试追问

1. **什么时候触发 Full GC？** 调用 System.gc()（建议禁用）、老年代空间不足、CMS GC 时晋升失败（Promotion Failed）/并发模式失败（Concurrent Mode Failure）、元空间（Metaspace）不足。

2. **三色标记法是什么？** GC 并发标记的核心算法。白色（未访问）、灰色（自身访问但子引用未遍历）、黑色（所有引用遍历完毕）。CMS 和 G1 都基于三色标记，区别在于处理"漏标"的方式：CMS 用增量更新，G1 用 SATB。

3. **为什么不建议在生产环境用 CMS？CMS 被废弃的原因？** JDK 14 已正式删除 CMS。主要原因是碎片严重导致 Full GC；无法预测停顿时间；对 CPU 资源要求高（对 CPU 敏感型应用不友好）。G1 是更现代的替代方案。

4. **ZGC 为什么停顿 <1ms？** 染色指针（Colored Pointers）将 GC 信息编码在 64 位指针中（目前只用低 42 位寻址，高 4 位用于标记）。通过读屏障实现"并发整理"——应用线程访问被搬移的对象时自动重定位，无需 STW。
