---
title: 进程与线程
category: interview
module: iv-osnet
subcat: roadmap
timeline: false
level: medium
tier: core
readMinutes: 10
tags: "操作系统与网络, OS, 进程线程"
summary: 区别、通信与上下文切换
order: 1
---

- 进程资源分配单位，线程 CPU 调度单位
- 线程共享地址空间，进程隔离
- IPC：管道/消息队列/共享内存/信号/套接字

```plaintext
进程: 独立地址空间, 资源开销大
线程: 共享地址空间, 切换开销小
通信: pipe / shared memory / socket / signal
```

> 协程是用户态轻量级线程。

**自查清单**
- [ ] 能说区别
- [ ] 能列 IPC
