---
title: 内存管理
category: interview
module: iv-osnet
subcat: roadmap
timeline: false
level: hard
tier: key
readMinutes: 11
tags: "操作系统与网络, OS, 内存"
summary: 分页、分段与虚拟内存
order: 3
---

- 虚拟内存隔离进程、扩大可用空间
- 分页按固定大小，分段按逻辑
- 页面置换：FIFO/LRU/Clock

```plaintext
虚拟地址 -> MMU -> 物理地址
页表: 虚拟页号 -> 物理页框
缺页中断: 页面不在内存时触发
```

> TLB 缓存页表项加速地址转换。

**自查清单**
- [ ] 能说虚拟内存
- [ ] 能说置换算法
