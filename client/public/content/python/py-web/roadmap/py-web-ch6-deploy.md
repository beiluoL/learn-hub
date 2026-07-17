---
title: 部署与 ASGI
category: python
module: py-web
subcat: roadmap
timeline: false
level: hard
tier: extra
readMinutes: 13
tags: Web 开发 (Flask/FastAPI/Django/异步)
summary: Gunicorn/Uvicorn 上线
order: 7
---

- WSGI 与 ASGI 区别
- uvicorn 跑异步应用
- gunicorn + uvicorn worker
- nginx 反向代理

```bash
uvicorn main:app --host 0.0.0.0 --port 8000
gunicorn -k uvicorn.workers.UvicornWorker main:app -w 4
```

**自查清单**
- [ ] 用 uvicorn 启动
- [ ] 理解 ASGI 含义
