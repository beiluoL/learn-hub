---
title: FastAPI 与类型
category: python
module: py-web
subcat: roadmap
timeline: false
level: medium
tier: core
readMinutes: 15
tags: Web 开发 (Flask/FastAPI/Django/异步)
summary: 类型注解驱动接口
order: 3
---

- FastAPI 基于类型生成文档
- Pydantic 校验请求体
- 自动生成 OpenAPI/Swagger
- 异步 async def 视图

```python
from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI()

class Item(BaseModel):
    name: str
    price: float

@app.post("/items")
def create(item: Item):
    return {"ok": True, "item": item.model_dump()}
```

**自查清单**
- [ ] 用 Pydantic 校验
- [ ] 访问 /docs 文档
