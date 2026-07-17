---
title: 数据库与 ORM
category: python
module: py-web
subcat: roadmap
timeline: false
level: medium
tier: core
readMinutes: 15
tags: Web 开发 (Flask/FastAPI/Django/异步)
summary: SQLAlchemy 核心用法
order: 5
---

- engine/session 管理连接
- 声明式模型定义
- query 增删改查
- 迁移工具 alembic

```python
from sqlalchemy import Column, Integer, String, create_engine
from sqlalchemy.orm import declarative_base, Session

Base = declarative_base()
engine = create_engine("sqlite:///app.db")

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True)
    name = Column(String)

Base.metadata.create_all(engine)
```

**自查清单**
- [ ] 创建引擎与模型
- [ ] 理解 session
