---
title: Web 开发：FastAPI 实战
category: python
level: intermediate
readMinutes: 16
tags: "FastAPI, Web, API, Pydantic"
summary: 用 FastAPI 快速构建类型安全、自带文档的异步 Web 服务。
order: 4
---

## 一、最小应用

```
from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI()

class Item(BaseModel):
    name: str
    price: float

@app.get("/")
def root():
    return {"msg": "hello"}

@app.post("/items")
def create(item: Item):
    return {"id": 1, **item.model_dump()}
```

启动：`uvicorn main:app --reload`，自动获得 `/docs` 交互式 Swagger 文档。

## 二、为什么快

-   基于 **Starlette**（ASGI）+ **Pydantic**（数据校验），原生支持异步
-   依赖注入系统管理数据库连接、鉴权等
-   类型标注驱动自动校验与文档生成

## 三、依赖注入示例

```
from fastapi import Depends

def get_db():
    db = connect()
    try:
        yield db
    finally:
        db.close()

@app.get("/users")
def list_users(db = Depends(get_db)):
    return db.query("SELECT * FROM users")
```

对比 Flask（同步、轻量、生态成熟）与 Django（全家桶、ORM 强）：选 FastAPI 做现代 API 服务，选 Django 做传统全栈业务。
