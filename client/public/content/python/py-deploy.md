---
title: Python 应用部署与容器化实战
category: python
level: advanced
readMinutes: 18
tags: "部署, gunicorn, Docker, 容器化"
summary: Python 应用部署与容器化实战。
order: 35
prereq: python/py-web
---

将 Python 应用从开发环境部署到生产环境，涉及 WSGI/ASGI 服务器选型、Docker 容器化、配置管理、健康检查等多个环节。本文覆盖从单机到容器化的完整部署流程。

## WSGI vs ASGI

Python Web 应用和 Web 服务器之间的通信协议经历了从 WSGI 到 ASGI 的演进：

| 特性 | WSGI | ASGI |
|------|------|------|
| 并发模型 | 同步（一个请求一个线程） | 异步（async/await） |
| 应用框架 | Flask、Django 2.x | FastAPI、Django 3.0+、Starlette |
| 多连接支持 | 否 | 原生支持 WebSocket、SSE |
| 性能 | 受线程数限制 | 单线程高并发 |

**选择规则**：Flask / Django 传统应用使用 WSGI（gunicorn）；FastAPI / Django Channels 使用 ASGI（uvicorn）。

## Gunicorn + Uvicorn Workers

Gunicorn 是最流行的 WSGI 服务器，Uvicorn 是最流行的 ASGI 服务器。两者可以通过 worker 类组合使用：

```bash
# WSGI 应用（Flask/Django）
gunicorn -w 4 -b 0.0.0.0:8000 app:app

# ASGI 应用（FastAPI）— 使用 uvicorn worker
gunicorn -w 4 -k uvicorn.workers.UvicornWorker -b 0.0.0.0:8000 app:app

# 也可以直接用 uvicorn
uvicorn app:app --host 0.0.0.0 --port 8000 --workers 4
```

**Gunicorn 关键参数**：

```bash
gunicorn -w 4 \                      # worker 数量：CPU 核心数 x 2 + 1
         -k uvicorn.workers.UvicornWorker \  # worker 类型
         -b 0.0.0.0:8000 \           # 绑定地址
         --timeout 30 \              # worker 超时（秒）
         --max-requests 1000 \       # 每个 worker 处理完 N 个请求后重启（防止内存泄漏）
         --max-requests-jitter 100 \ # 随机偏移，防止同时重启
         --access-logfile - \        # 访问日志输出到 stdout
         --error-logfile - \         # 错误日志输出到 stderr
         --graceful-timeout 10 \     # 优雅关机超时
         app:app
```

**注意**：`max-requests` 是重要的防内存泄漏措施。即使代码没有显式泄漏，Python 的内存碎片也会随时间累积。设置该值让 worker 周期性重启，保持内存健康。

## Dockerfile 分层优化

Docker 镜像构建的核心原则是：利用层缓存，将变化频率低的文件放在前面：

```dockerfile
# 第一阶段：构建阶段
FROM python:3.12-slim AS builder

WORKDIR /app

# 安装系统依赖（如编译 Python 包所需的 C 库）
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc libpq-dev && \
    rm -rf /var/lib/apt/lists/*

# 先复制依赖文件（变化频率低，利用缓存）
COPY pyproject.toml poetry.lock ./
RUN pip install poetry && poetry config virtualenvs.create false
RUN poetry install --no-dev --no-root

# 第二阶段：运行阶段（多阶段构建减小镜像体积）
FROM python:3.12-slim AS runtime

WORKDIR /app

# 从构建阶段复制已安装的包
COPY --from=builder /usr/local/lib/python3.12/site-packages /usr/local/lib/python3.12/site-packages
COPY --from=builder /usr/local/bin /usr/local/bin

# 复制应用代码（变化频率高，放在最后）
COPY src/ ./src/

# 非 root 用户运行（安全最佳实践）
RUN useradd -m -u 1000 appuser && chown -R appuser:appuser /app
USER appuser

EXPOSE 8000

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/health')"

CMD ["gunicorn", "-w", "4", "-k", "uvicorn.workers.UvicornWorker", "-b", "0.0.0.0:8000", "app:app"]
```

**Dockerfile 优化要点**：
1. 多阶段构建：编译依赖留在 builder 阶段
2. 先复制依赖文件再复制源码，利用层缓存
3. 使用 `.dockerignore` 排除 `__pycache__`、`.git`、`.venv`
4. 禁止 root 运行（`USER appuser`）
5. `slim` 镜像比 `alpine` 兼容性更好（alpine 使用 musl libc，某些 Wheels 不兼容）

## Docker-Compose 编排

```yaml
# docker-compose.yml
version: '3.8'

services:
  web:
    build: .
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=postgresql://user:pass@db:5432/mydb
      - REDIS_URL=redis://redis:6379/0
    depends_on:
      db:
        condition: service_healthy
      redis:
        condition: service_started
    restart: unless-stopped
    volumes:
      - ./uploads:/app/uploads  # 持久化上传文件

  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: user
      POSTGRES_PASSWORD: pass
      POSTGRES_DB: mydb
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U user"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data

  celery_worker:
    build: .
    command: celery -A app.celery worker -l INFO
    depends_on:
      - redis
      - db
    restart: unless-stopped

  celery_beat:
    build: .
    command: celery -A app.celery beat -l INFO
    depends_on:
      - redis
      - db
    restart: unless-stopped

volumes:
  postgres_data:
  redis_data:
```

## 环境变量与配置管理

```python
# config.py
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    """使用 Pydantic Settings 管理配置，自动从环境变量加载"""

    app_name: str = 'MyApp'
    debug: bool = False
    database_url: str = 'postgresql://localhost:5432/mydb'
    redis_url: str = 'redis://localhost:6379/0'
    secret_key: str
    sentry_dsn: str | None = None
    log_level: str = 'INFO'

    model_config = {'env_file': '.env', 'env_file_encoding': 'utf-8'}

settings = Settings()  # 自动读取环境变量
```

优先级：环境变量 > `.env` 文件 > 代码默认值。生产环境敏感信息（密码、密钥）务必通过环境变量注入，绝不可硬编码或提交到 Git。

## 健康检查

```python
# health.py
from fastapi import FastAPI

app = FastAPI()

@app.get('/health')
def health_check():
    # 基础健康检查
    return {'status': 'ok'}

@app.get('/health/ready')
def readiness_check():
    # 就绪检查（检查关键依赖是否可用）
    try:
        db.execute('SELECT 1')
        redis.ping()
    except Exception:
        raise HTTPException(503, detail='依赖不可用')
    return {'status': 'ready'}
```

Docker 和 K8s 使用健康检查端点进行存活探测（liveness）和就绪探测（readiness）。存活探测失败会重启容器，就绪探测失败会暂时停止流量分发。

## 优雅关机

```python
# FastAPI 优雅关机示例
import signal
import asyncio

async def shutdown():
    """关闭数据库连接、停止后台任务"""
    await db.disconnect()
    await redis.close()

def handle_sigterm():
    loop = asyncio.get_event_loop()
    loop.create_task(shutdown())

# 注册信号处理器
signal.signal(signal.SIGTERM, lambda s, f: handle_sigterm())
signal.signal(signal.SIGINT, lambda s, f: handle_sigterm())
```

Gunicorn 收到 SIGTERM 后会等待 `graceful-timeout` 秒让现有请求完成，然后强制关闭。配合 `max-requests` 重启机制，确保应用始终处于健康状态。

## 部署 FastAPI 到 Docker（完整示例）

```dockerfile
# Dockerfile
FROM python:3.12-slim AS builder
WORKDIR /app
COPY pyproject.toml poetry.lock ./
RUN pip install poetry && \
    poetry config virtualenvs.create false && \
    poetry install --no-dev --no-root

FROM python:3.12-slim AS runtime
WORKDIR /app
COPY --from=builder /usr/local/lib/python3.12/site-packages /usr/local/lib/python3.12/site-packages
COPY --from=builder /usr/local/bin /usr/local/bin
COPY src/ ./src/
RUN useradd -m appuser && chown -R appuser:appuser /app
USER appuser
EXPOSE 8000
CMD ["gunicorn", "-w", "4", "-k", "uvicorn.workers.UvicornWorker", \
     "--timeout", "30", "--max-requests", "1000", \
     "-b", "0.0.0.0:8000", "main:app"]
```

```bash
# 构建与运行
docker build -t my-fastapi-app .
docker run -d -p 8000:8000 --env-file .env.production my-fastapi-app
```

## 实际开发中的应用 / 常见问题

**Worker 数量如何确定**：经验公式 `CPU 核心数 x 2 + 1` 适用于 IO 密集型应用；CPU 密集型为 `核心数 + 1`。实际应通过压测验证——worker 过多会增加上下文切换开销，过少则无法充分利用资源。

**Docker 镜像体积优化**：使用 slim/alpine 基础镜像；多阶段构建排除编译工具；`.dockerignore` 排除不必要文件；合并 RUN 指令减少层数；移除 pip/pipenv 缓存。通常一个优化后的 Python 镜像在 150-300MB 之间。

**日志收集策略**：容器化应用的日志应输出到 stdout/stderr，而非写入容器内文件。使用 Docker 的日志驱动（json-file/journald）或 Loki/Fluentd 收集日志。Gunicorn 的 `--access-logfile -` 和 `--error-logfile -` 将日志导向标准输出。
