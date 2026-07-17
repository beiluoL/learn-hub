---
title: 锁与同步
category: interview
module: iv-osnet
subcat: roadmap
timeline: false
level: hard
tier: key
readMinutes: 12
tags: "操作系统与网络, OS, 锁, 死锁"
summary: 互斥锁、死锁与 PV 操作
order: 2
---

- 死锁四条件：互斥/占有等待/不可剥夺/循环等待
- 预防：按序加锁、超时、银行家算法
- 信号量 PV 实现同步互斥

```plaintext
死锁四条件:
1. 互斥
2. 占有且等待
3. 不可剥夺
4. 循环等待
破坏任一即可预防死锁
```

> 实际常用按序加锁 + 超时打破循环等待。

**自查清单**
- [ ] 能说四条件
- [ ] 能说预防
