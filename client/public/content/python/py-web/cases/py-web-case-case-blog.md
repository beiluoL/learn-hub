---
title: 简易博客系统
category: python
module: py-web
subcat: cases
timeline: false
level: hard
tier: key
readMinutes: 30
tags: "Web 开发 (Flask/FastAPI/Django/异步), 项目案例"
summary: Django 实现文章与后台
order: 2
---

- Article 模型与迁移
- 列表与详情视图
- admin 录入文章
- 模板渲染页面

```python
from django.shortcuts import render
from .models import Article

def list_view(request):
    articles = Article.objects.all()[:10]
    return render(request, "list.html", {"articles": articles})
```

**自查清单**
- [ ] 文章可后台录入
- [ ] 前台能浏览
