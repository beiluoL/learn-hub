---
title: 待办事项 REST API
category: python
module: py-web
subcat: cases
timeline: false
level: medium
tier: core
readMinutes: 26
tags: "Web 开发 (Flask/FastAPI/Django/异步), 项目案例"
summary: FastAPI 实现增删改查
order: 1
---

- 定义 Todo 模型
- 实现列表与创建接口
- PATCH 更新完成状态
- DELETE 删除条目

```python
from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI()
todos = []

class Todo(BaseModel):
    title: str
    done: bool = False

@app.post("/todos")
def add(t: Todo):
    todos.append(t)
    return {"count": len(todos)}
```

**自查清单**
- [ ] 能新增待办
- [ ] 能列出待办
