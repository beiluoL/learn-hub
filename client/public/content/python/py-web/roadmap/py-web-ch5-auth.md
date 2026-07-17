---
title: 认证与鉴权
category: python
module: py-web
subcat: roadmap
timeline: false
level: hard
tier: key
readMinutes: 16
tags: Web 开发 (Flask/FastAPI/Django/异步)
summary: JWT 与会话管理
order: 6
---

- 密码哈希用 bcrypt
- JWT 无状态令牌
- 依赖注入校验权限
- CSRF/CORS 基础防护

```python
import jwt

token = jwt.encode({"uid": 1}, "secret", algorithm="HS256")
payload = jwt.decode(token, "secret", algorithms=["HS256"])
print(payload)
```

> 密钥应放在环境变量，切勿硬编码。

**自查清单**
- [ ] 签发与校验 JWT
- [ ] 密码做哈希
