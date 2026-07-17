---
title: HTTP 与 HTTPS
category: interview
module: iv-osnet
subcat: roadmap
timeline: false
level: medium
tier: core
readMinutes: 10
tags: "操作系统与网络, 网络, HTTP"
summary: 版本差异与安全传输
order: 5
---

- HTTP1.1 持久连接，HTTP2 多路复用
- HTTPS = TLS 握手 + 对称加密
- GET/POST 语义差异

```bash
curl -i https://example.com
# HTTP/2 200
# content-type: text/html
# 查看 TLS 版本:
openssl s_client -connect example.com:443
```

> HTTP3 基于 QUIC(UDP)，降低握手延迟。

**自查清单**
- [ ] 能说版本差异
- [ ] 能说 HTTPS 流程
