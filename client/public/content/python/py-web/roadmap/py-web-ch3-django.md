---
title: Django 全栈框架
category: python
module: py-web
subcat: roadmap
timeline: false
level: hard
tier: key
readMinutes: 16
tags: Web 开发 (Flask/FastAPI/Django/异步)
summary: ORM、视图与 MTV 架构
order: 4
---

- models 定义数据表
- ORM 查询 API
- views + urls 路由
- admin 后台开箱即用

```python
from django.db import models

class Article(models.Model):
    title = models.CharField(max_length=200)
    body = models.TextField()
    created = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title
```

> 运行前需执行 migrate 建表。

**自查清单**
- [ ] 定义 Django 模型
- [ ] 用 ORM 查询
