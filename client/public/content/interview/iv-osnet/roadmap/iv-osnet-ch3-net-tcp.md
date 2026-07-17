---
title: TCP 与 UDP
category: interview
module: iv-osnet
subcat: roadmap
timeline: false
level: hard
tier: key
readMinutes: 13
tags: "操作系统与网络, 网络, TCP"
summary: 三次握手、四次挥手与可靠传输
order: 4
---

- 三次握手建立连接，四次挥手断开
- 可靠：序列号/确认/重传/滑动窗口
- UDP 无连接、快、可广播

```plaintext
SYN -> 
<- SYN+ACK
ACK ->
连接建立
---
FIN -> 
<- ACK
<- FIN
ACK ->
连接关闭
```

> TIME_WAIT 确保最后 ACK 到达，默认 2MSL。

**自查清单**
- [ ] 能说握手挥手
- [ ] 能说可靠机制
