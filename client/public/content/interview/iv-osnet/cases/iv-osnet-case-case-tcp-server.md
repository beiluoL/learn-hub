---
title: 手写简易 TCP 回显服务
category: interview
module: iv-osnet
subcat: cases
timeline: false
level: medium
tier: key
readMinutes: 14
tags: "操作系统与网络, 项目案例"
summary: 理解 socket 编程与连接生命周期
order: 1
---

- server socket bind/listen/accept
- client connect/send/recv
- 理解阻塞 IO 与连接管理

```bash
# 用 nc 验证回显服务
nc -l 8080            # 服务端监听
# 另开终端
nc localhost 8080     # 客户端连接
```

**自查清单**
- [ ] 理解 socket 流程
- [ ] 能解释三次握手
