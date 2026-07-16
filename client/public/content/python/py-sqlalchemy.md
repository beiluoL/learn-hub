---
title: SQLAlchemy ORM 核心用法与 Alembic 数据库迁移
category: python
level: intermediate
readMinutes: 18
tags: "SQLAlchemy, ORM, 会话, Alembic"
summary: SQLAlchemy ORM 核心用法与 Alembic 数据库迁移。
order: 24
prereq: python/py-basics
---

SQLAlchemy 是 Python 中最强大的数据库工具包，提供了 Core（底层 SQL 表达式语言）和 ORM（对象关系映射）两个层面的抽象。它既能让开发者以 Python 对象的方式操作数据库，也支持直接使用原生 SQL，是灵活性最高、生态最成熟的 Python 数据库库。

## declarative_base 模型定义

现代 SQLAlchemy 推荐使用 `DeclarativeBase` 或 `declarative_base()` 定义模型：

```python
from sqlalchemy import create_engine, Column, Integer, String, Text, ForeignKey, DateTime
from sqlalchemy.orm import DeclarativeBase, relationship
from datetime import datetime

class Base(DeclarativeBase):
    pass

class User(Base):
    __tablename__ = 'users'

    id = Column(Integer, primary_key=True)
    name = Column(String(50), nullable=False)
    email = Column(String(100), unique=True)
    posts = relationship('Post', back_populates='author')

class Post(Base):
    __tablename__ = 'posts'

    id = Column(Integer, primary_key=True)
    title = Column(String(200))
    content = Column(Text)
    author_id = Column(Integer, ForeignKey('users.id'))
    created_at = Column(DateTime, default=datetime.utcnow)

    author = relationship('User', back_populates='posts')
```

**注意**：`relationship` 定义了 Python 对象之间的关联，不会在数据库层面创建外键——外键由 `ForeignKey` 负责。两者通常结合使用，但概念上相互独立。

## Session 与事务管理

Session 是 SQLAlchemy 的核心工作单元，管理所有持久化操作：

```python
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

engine = create_engine('sqlite:///app.db', echo=True)  # echo=True 打印 SQL
Session = sessionmaker(bind=engine)

def create_user():
    with Session() as session:  # 上下文管理器自动 commit/rollback
        user = User(name='Alice', email='alice@example.com')
        session.add(user)
        # session.commit() 自动由 __exit__ 调用
        # session.refresh(user) 可获取数据库生成的 id

def transfer_points(from_id, to_id, amount):
    with Session() as session:
        with session.begin():  # 显式事务
            sender = session.get(User, from_id)
            receiver = session.get(User, to_id)
            sender.points -= amount
            receiver.points += amount
            # session.begin() 上下文退出时自动 commit 或 rollback
```

Session 的生命周期管理是 SQLAlchemy 应用中容易出错的地方。推荐使用 `sessionmaker` 创建 Session 工厂，每次请求创建新 Session，请求结束后关闭。

## Relationship 关联查询

SQLAlchemy 的 `relationship` 提供了丰富的关联加载策略：

```python
class User(Base):
    __tablename__ = 'users'
    id = Column(Integer, primary_key=True)
    name = Column(String(50))

    # lazy: select(默认,延迟加载), joined(eager加载), subquery, dynamic
    posts = relationship('Post', back_populates='author', lazy='select')

# 使用 joinedload 在查询时指定 eager 加载
from sqlalchemy.orm import joinedload, selectinload

# 方式一：joinedload（LEFT JOIN）
users = session.query(User).options(joinedload(User.posts)).all()

# 方式二：selectinload（IN 查询，推荐用于多对多和大量数据）
users = session.query(User).options(selectinload(User.posts)).all()
```

**加载策略对比**：

| 策略 | SQL 方式 | 适用场景 |
|------|---------|---------|
| `lazy='select'`（默认） | 访问时单独查询 | 不总是需要关联数据的场景 |
| `joinedload` | LEFT JOIN | 一对一、多对一，数据量适中 |
| `selectinload` | IN 查询 | 一对多、多对多，数据量较大 |
| `lazy='dynamic'` | 返回 Query 对象 | 需要进一步过滤的大数据集 |

## 原生 SQL vs ORM

SQLAlchemy 允许在 ORM 和原生 SQL 之间自由切换：

```python
# ORM 风格
posts = session.query(Post).filter(Post.title.contains('Python')).all()

# Core 风格（更接近 SQL）
from sqlalchemy import select
stmt = select(Post).where(Post.title.contains('Python'))
posts = session.execute(stmt).scalars().all()

# 原生 SQL
result = session.execute(
    text('SELECT * FROM posts WHERE title LIKE :pattern'),
    {'pattern': '%Python%'}
)
posts = result.fetchall()
```

## 连接池 Engine

`create_engine` 内置了连接池，可以通过参数灵活配置：

```python
engine = create_engine(
    'postgresql://user:pass@localhost/dbname',
    pool_size=10,          # 连接池大小
    max_overflow=20,       # 超出 pool_size 的最大连接数
    pool_recycle=3600,     # 连接最大存活时间（秒）
    pool_pre_ping=True,    # 使用前检查连接是否有效（防止 MySQL 断连）
    echo=False             # 生产环境关闭 SQL 日志
)
```

## Alembic 数据库迁移

Alembic 是 SQLAlchemy 官方的数据库迁移工具，用于管理数据库结构变更：

```bash
# 初始化 Alembic
alembic init alembic

# 编辑 alembic.ini 设置数据库连接
# sqlalchemy.url = postgresql://user:pass@localhost/dbname

# 编辑 alembic/env.py 导入 Base metadata
# target_metadata = Base.metadata

# 自动生成迁移脚本
alembic revision --autogenerate -m "add user table"

# 执行迁移
alembic upgrade head

# 回滚
alembic downgrade -1

# 查看迁移历史
alembic history
```

关键的 `env.py` 配置：

```python
# alembic/env.py
from app.models import Base  # 导入所有模型
target_metadata = Base.metadata

def run_migrations_offline():
    """离线模式：生成 SQL 脚本"""
    context.configure(url=url, target_metadata=target_metadata, literal_binds=True)

def run_migrations_online():
    """在线模式：直接连接数据库执行"""
    connectable = engine_from_config(config.get_section(config.config_ini_section))
    with connectable.connect() as connection:
        context.configure(connection=connection, target_metadata=target_metadata)
        with connection.begin() as transaction:
            context.run_migrations()
```

## 与 FastAPI / Flask 集成

```python
# FastAPI 集成示例
from fastapi import FastAPI, Depends
from sqlalchemy.orm import Session

app = FastAPI()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.get('/users')
def list_users(db: Session = Depends(get_db)):
    return db.query(User).all()
```

## 实际开发中的应用 / 常见问题

**Session 并发安全问题**：SQLAlchemy Session 不是线程安全的。每个请求/线程应当创建独立的 Session。在 Web 应用中使用 `scoped_session` 确保线程隔离。

**大结果集内存控制**：使用 `yield_per()` 分批获取数据，而非一次性加载全部到内存。对于报表查询，考虑使用 Core 层或原生 SQL 直接操作游标。

**迁移脚本的审核**：`autogenerate` 自动检测模型变更生成迁移，但它无法处理所有情况（如列重命名、表重命名）。生成的迁移脚本务必人工审核后再执行，尤其在生产环境。
