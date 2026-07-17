---
title: Flask 快速入门
category: python
module: py-web
subcat: roadmap
timeline: false
level: medium
tier: core
readMinutes: 14
tags: Web 开发 (Flask/FastAPI/Django/异步)
summary: 轻量级路由与视图
order: 2
---

- @app.route 定义路由
- request 获取参数
- jsonify 返回 JSON
- 蓝图组织模块

```python
from flask import Flask, request, jsonify

app = Flask(__name__)

@app.route("/hello", methods=["GET"])
def hello():
    name = request.args.get("name", "world")
    return jsonify(msg=f"hello {name}")
```

**自查清单**
- [ ] 定义 GET 路由
- [ ] 返回 JSON 响应
