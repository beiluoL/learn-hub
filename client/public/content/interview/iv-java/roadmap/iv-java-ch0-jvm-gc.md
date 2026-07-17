---
title: JVM 垃圾回收
category: interview
module: iv-java
subcat: roadmap
timeline: false
level: hard
tier: key
readMinutes: 12
tags: "Java 面试, JVM, GC"
summary: 分代回收、GC 算法与常见收集器原理
order: 1
---

理解对象存活判定与回收过程是 Java 岗必考基础。

- 可达性分析：以 GC Roots 为起点，不可达对象可被回收
- 分代假说：新生代(Minor GC)与老年代(Major/Full GC)
- 常见收集器：CMS(并发标记清除)、G1(分 Region 可预测停顿)、ZGC
- Stop-The-World：除 ZGC/Shenandoah 外收集均存在 STW

```java
// 触发 Full GC 的典型方式（仅演示，勿滥用）
public class GcDemo {
    public static void main(String[] args) {
        System.gc(); // 建议 JVM 进行 GC，不保证立即执行
        Runtime.getRuntime().gc();
    }
}
```

> 注意：System.gc() 只是建议；G1 通过 MaxGCPauseMillis 设定目标停顿。

**自查清单**
- [ ] 能说出 GC Roots 包含哪些
- [ ] 能对比 CMS 与 G1 差异
