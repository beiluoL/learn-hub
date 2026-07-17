---
title: HTTP 与缓存
category: interview
module: iv-fe
subcat: roadmap
timeline: false
level: medium
tier: core
readMinutes: 9
tags: "前端面试, HTTP, 缓存"
summary: 状态码、强缓存与协商缓存
order: 5
---

- 强缓存：Cache-Control / Expires
- 协商缓存：ETag / Last-Modified
- 301 永久、302 临时、304 未修改
- HTTPS = HTTP + TLS 加密

```http
GET /a.js HTTP/1.1
Host: example.com
If-None-Match: "abc123"

HTTP/1.1 304 Not Modified
Cache-Control: max-age=3600
```

> ETag 精度优于 Last-Modified，避免秒级缓存失效。

**自查清单**
- [ ] 能区分两类缓存
- [ ] 能说状态码含义
