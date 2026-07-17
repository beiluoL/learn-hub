---
title: HTTP 与请求模型
category: python
module: py-web
subcat: roadmap
timeline: false
level: easy
tier: basic
readMinutes: 10
tags: Web 开发 (Flask/FastAPI/Django/异步)
summary: 理解请求/响应与状态码
order: 1
---

- 方法 GET/POST/PUT/DELETE
- 状态码 2xx/3xx/4xx/5xx
- 请求头与查询参数
- JSON 作为主流载荷

```http
GET /api/users?page=1 HTTP/1.1
Host: example.com
Accept: application/json

HTTP/1.1 200 OK
Content-Type: application/json

{"data": []}
```

**自查清单**
- [ ] 说清 GET 与 POST
- [ ] 认识常见状态码
