---
title: 进程调度
category: interview
module: iv-osnet
subcat: roadmap
timeline: false
level: medium
tier: core
readMinutes: 9
tags: "操作系统与网络, OS, 调度"
summary: 调度算法与上下文切换
order: 7
---

- FCFS/SJF/RR/优先级/多级反馈队列
- 上下文切换保存寄存器与状态
- 抢占式 vs 非抢占式

```plaintext
RR(时间片轮转): 公平, 适合分时
多级反馈队列: 兼顾响应与吞吐
上下文切换: 保存/恢复寄存器与 PCB
```

> 时间片过小切换开销大，过大退化为 FCFS。

**自查清单**
- [ ] 能列算法
- [ ] 能说上下文切换
