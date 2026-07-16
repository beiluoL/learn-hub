---
title: FastAPI 异步 Web 框架
category: python
level: intermediate
readMinutes: 18
tags: "FastAPI, async, Pydantic, OpenAPI"
summary: FastAPI 异步 Web 框架：类型校验、自动文档与依赖注入。
order: 22
prereq: python/py-basics
---

FastAPI 是一个现代高性能 Python Web 框架，基于 Starlette（异步 Web 核心）和 Pydantic（数据校验）。它利用 Python 类型注解实现了请求/响应数据的自动校验、序列化和 API 文档生成，是目前 Python API 开发的首选框架之一。

## 异步 vs 同步

FastAPI 的核心优势在于原生支持异步。在理解其性能之前，需要先区分两种场景：

- **IO 密集型**（数据库查询、HTTP 请求、文件读写）：使用 `async/await`，在等待 IO 时让出 CPU 处理其他请求，大幅提升吞吐量。
- **CPU 密集型**（计算、加密、图像处理）：`async` 没有优势，反而可能阻塞事件循环，应使用 `def` 定义并将任务委托给线程池。

```python
@app.get('/io-task')
async def io_task():
    # IO 操作：await 挂起协程，不阻塞其他请求
    result = await database.fetch_all("SELECT ...")
    return result

@app.get('/cpu-task')
def cpu_task():
    # CPU 密集：用普通函数，FastAPI 在线程池中执行
    return heavy_computation()
```

## 路由与类型注解

FastAPI 路由通过装饰器定义，路径参数和查询参数由类型注解自动校验：

```python
from fastapi import FastAPI
from enum import Enum

app = FastAPI()

class Category(str, Enum):
    tech = "tech"
    life = "life"

@app.get('/items/{item_id}')
async def get_item(
    item_id: int,           # 路径参数，自动转为 int
    q: str | None = None,   # 可选查询参数
    category: Category = Category.tech  # 枚举校验
):
    return {'item_id': item_id, 'q': q, 'category': category}

@app.post('/items')
async def create_item(name: str, price: float):
    return {'name': name, 'price': price}
```

**注意**：FastAPI 根据参数是否出现在路径中自动区分路径参数和查询参数。类型注解不仅是文档，更是运行时的强制校验——传入 `item_id` 为 `"abc"` 会直接返回 422 错误。

## Pydantic 请求体 / 响应模型

FastAPI 使用 Pydantic 模型定义请求体和响应结构，自动完成校验、序列化与文档生成：

```python
from pydantic import BaseModel, Field, EmailStr
from datetime import datetime

class ItemCreate(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    price: float = Field(gt=0, description="价格必须大于 0")
    tags: list[str] = []

class ItemResponse(BaseModel):
    id: int
    name: str
    price: float
    created_at: datetime

    model_config = {'from_attributes': True}  # 允许 ORM 对象直接转换

@app.post('/items', response_model=ItemResponse)
async def create_item(item: ItemCreate):
    # item 已经是校验后的 Pydantic 对象
    db_item = await save_to_db(item)
    return db_item  # FastAPI 自动按 ItemResponse 序列化
```

Pydantic v2 使用 Rust 内核，校验速度比 v1 快 5-50 倍。`Field` 可以提供更详细的校验规则和文档描述。

## 自动生成 Swagger / OpenAPI 文档

FastAPI 自动为你的 API 生成交互式文档，只需访问：

- `/docs` — Swagger UI 交互式文档
- `/redoc` — ReDoc 静态文档
- `/openapi.json` — OpenAPI 规范 JSON

这些文档根据路由、类型注解和 Pydantic 模型自动生成，无需额外配置。你可以在 `FastAPI()` 构造函数中自定义文档标题、版本等信息：

```python
app = FastAPI(
    title="My API",
    description="API 服务说明",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc"
)
```

## 依赖注入 Depends

FastAPI 的依赖注入系统是其最强大的特性之一，用于复用逻辑和声明依赖关系：

```python
from fastapi import Depends, HTTPException, Header

async def get_current_user(authorization: str = Header()):
    """从请求头获取 token 并验证用户"""
    if not authorization.startswith('Bearer '):
        raise HTTPException(status_code=401, detail='未认证')
    user = await verify_token(authorization.split(' ')[1])
    return user

def get_db():
    """数据库会话依赖"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.get('/me')
async def read_me(
    user = Depends(get_current_user),
    db = Depends(get_db)
):
    # 两个依赖自动解析并注入
    return {'username': user.username}
```

依赖可以嵌套——一个依赖可以依赖另一个依赖，FastAPI 自动解析依赖树。`yield` 形式的依赖在请求结束后自动执行清理代码。

## 中间件

FastAPI 基于 Starlette，中间件用于在请求/响应流程中插入全局逻辑：

```python
from fastapi import Request
import time

@app.middleware('http')
async def add_process_time_header(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    response.headers['X-Process-Time'] = str(process_time)
    return response
```

## 后台任务 BackgroundTasks

对于不需要立即返回结果的操作，可以使用后台任务：

```python
from fastapi import BackgroundTasks

def send_email(email: str, message: str):
    # 模拟发送邮件
    print(f'Sending to {email}: {message}')

@app.post('/register')
async def register(email: str, background_tasks: BackgroundTasks):
    background_tasks.add_task(send_email, email, '欢迎注册')
    return {'message': '注册成功，邮件正在发送'}
```

后台任务在响应返回后执行，适合发送邮件、写日志等非关键操作。对于更复杂的任务编排，应使用 Celery 等专用任务队列。

## 与 SQLAlchemy 集成

```python
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase

engine = create_engine('sqlite:///app.db')
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

class Base(DeclarativeBase):
    pass

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.get('/users')
async def list_users(db=Depends(get_db)):
    return db.query(User).all()
```

使用 `Depends(get_db)` 注入数据库会话，利用 FastAPI 的依赖系统自动管理会话生命周期。

## 实际开发中的应用 / 常见问题

**async 函数中不要调用同步阻塞代码**：在 `async def` 视图函数中直接调用同步 ORM 方法（如 `db.query(...)`）会阻塞事件循环。解决方案是使用 `run_in_executor` 或将 ORM 操作放在 `def` 视图中让 FastAPI 自动放入线程池。

**大型项目如何组织**：推荐按功能模块拆分路由（`APIRouter`），然后导入到主应用中。目录结构通常为 `app/api/v1/users.py`、`app/models/`、`app/schemas/`、`app/services/`、`app/core/` 的分层模式。

**FastAPI vs Flask**：纯 API 服务选 FastAPI（类型安全、异步原生、自动文档）；服务端渲染网站选 Flask（Jinja2 生态成熟）；全栈 CMS 类应用选 Django（功能完整）。
