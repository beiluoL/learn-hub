---
title: 死锁分析与避免
category: interview
module: iv-osnet
subcat: cases
timeline: false
level: hard
tier: key
readMinutes: 16
tags: "操作系统与网络, 项目案例"
summary: 给定资源分配图判断是否死锁
order: 2
---

- 检查四个必要条件
- 银行家算法判断安全序列
- 资源分配图化简

```plaintext
Allocation  Need  Available
  P0: 0 1   7 4    3 3
  P1: 2 0   1 2
安全序列示例: P1 -> P0 (可全部完成)
```

**自查清单**
- [ ] 能画资源图
- [ ] 能求安全序列
