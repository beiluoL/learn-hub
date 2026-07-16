---
title: Django MVT 架构与快速上手
category: python
level: intermediate
readMinutes: 20
tags: "Django, MVT, ORM, Admin"
summary: Django MVT 架构与快速上手。
order: 21
prereq: python/py-basics
---

Django 是 Python 生态中最流行的全栈 Web 框架，遵循"电池齐全"（batteries included）的设计理念。它内置了 ORM、模板引擎、管理后台、认证系统、表单处理等全套组件，适合快速构建数据驱动的 Web 应用。

## MVT 架构

Django 采用 MVT（Model-View-Template）架构，与传统 MVC 的对应关系是：

| MVC 概念 | Django 对应 | 职责 |
|----------|------------|------|
| Model    | Model      | 数据层，定义数据结构与数据库交互 |
| View     | View       | 逻辑层，处理请求并返回响应 |
| Controller | Django 框架本身 | URL 分发与中间件 |

Django 中 View 承担了 MVC 中 Controller 的职责，而 Template 负责展示——这是理解 Django 架构的关键。

## 项目 vs 应用

```bash
# 创建项目
django-admin startproject myproject
cd myproject

# 创建应用
python manage.py startapp blog
```

一个 Django **项目** 可以包含多个**应用**，每个应用独立完成一个功能模块。项目级配置（`settings.py`）控制全局行为，应用级代码（`models.py`、`views.py`）专注业务逻辑。注册应用需在 `settings.py` 的 `INSTALLED_APPS` 中添加。

## ORM 模型定义

Django ORM 让你用 Python 类定义数据结构，框架自动生成对应的数据库表：

```python
from django.db import models

class Author(models.Model):
    name = models.CharField(max_length=100)
    email = models.EmailField(unique=True)
    bio = models.TextField(blank=True)

    def __str__(self):
        return self.name

class Article(models.Model):
    title = models.CharField(max_length=200)
    content = models.TextField()
    author = models.ForeignKey(Author, on_delete=models.CASCADE, related_name='articles')
    tags = models.ManyToManyField('Tag')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']  # 按创建时间倒序

class Tag(models.Model):
    name = models.CharField(max_length=50, unique=True)

    def __str__(self):
        return self.name
```

**注意**：ForeignKey 必须指定 `on_delete` 参数。`models.CASCADE` 表示级联删除，`models.SET_NULL` 表示设为 NULL（需要 `null=True`）。`related_name` 定义了反向查询的名称，不设置会自动生成但可读性差。

## QuerySet 查询

Django ORM 的 QuerySet 是惰性求值的——只有实际需要数据时才执行 SQL 查询：

```python
# 基本查询
articles = Article.objects.all()                    # SELECT * FROM article
recent = Article.objects.filter(status='published').order_by('-created_at')[:10]

# 条件筛选
articles = Article.objects.filter(
    author__name__icontains='张',        # 作者名包含"张"（不区分大小写）
    created_at__year=2024,               # 2024 年创建
    tags__name='Python'                  # 跨 ManyToMany 查询
)

# 聚合与统计
from django.db.models import Count, Avg
author_stats = Author.objects.annotate(
    article_count=Count('articles')
).filter(article_count__gt=5)            # 发文章超过 5 篇的作者

# 使用 select_related 和 prefetch_related 优化查询
articles = Article.objects.select_related('author').prefetch_related('tags')
```

`select_related` 通过 SQL JOIN 预加载外键关联对象，`prefetch_related` 通过额外查询预加载多对多关联——两者是 Django ORM 性能优化的关键手段。

## Admin 管理后台

Django Admin 是一个开箱即用的数据管理界面，只需在 `admin.py` 中注册模型：

```python
from django.contrib import admin
from .models import Article, Author, Tag

@admin.register(Article)
class ArticleAdmin(admin.ModelAdmin):
    list_display = ['title', 'author', 'created_at', 'status']  # 列表显示的列
    list_filter = ['status', 'created_at', 'tags']              # 侧栏过滤器
    search_fields = ['title', 'content']                        # 搜索字段
    prepopulated_fields = {'slug': ('title',)}                  # 从标题自动填充 slug

@admin.register(Author)
class AuthorAdmin(admin.ModelAdmin):
    list_display = ['name', 'email']
```

Admin 的强大之处在于它是声明式的——你只需描述要显示什么，Django 自动生成界面。通过自定义 `ModelAdmin` 类和 Action 方法，可以扩展出复杂的后台操作。

## 路由 urlpatterns

Django 使用 `urlpatterns` 列表将 URL 映射到视图：

```python
# project/urls.py
from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('blog/', include('blog.urls')),
]

# blog/urls.py
from django.urls import path
from . import views

urlpatterns = [
    path('', views.ArticleListView.as_view(), name='article-list'),
    path('<int:pk>/', views.ArticleDetailView.as_view(), name='article-detail'),
]
```

`include()` 将一组 URL 分发到子应用，保持路由配置的模块化。命名路由（`name='article-list'`）配合 `{% url %}` 模板标签实现路径解耦。

## 类视图 ListView / DetailView

Django 内置的通用类视图可以大幅减少样板代码：

```python
from django.views.generic import ListView, DetailView
from .models import Article

class ArticleListView(ListView):
    model = Article
    template_name = 'blog/article_list.html'
    context_object_name = 'articles'
    paginate_by = 10  # 每页 10 条

    def get_queryset(self):
        # 自定义查询集
        return Article.objects.filter(status='published')

class ArticleDetailView(DetailView):
    model = Article
    template_name = 'blog/article_detail.html'
    context_object_name = 'article'
```

类视图通过覆写 `get_queryset`、`get_context_data` 等方法实现定制，而非从头编写逻辑。

## 模板继承

Django 模板使用块继承机制避免重复代码：

```django
{# templates/base.html #}
<!DOCTYPE html>
<html>
<head>
    <title>{% block title %}My Site{% endblock %}</title>
    {% load static %}
    <link rel="stylesheet" href="{% static 'css/style.css' %}">
</head>
<body>
    {% include 'partials/header.html' %}
    <main>
        {% block content %}{% endblock %}
    </main>
    {% include 'partials/footer.html' %}
</body>
</html>
```

子模板通过 `{% extends %}` 继承基础模板，用 `{% block %}` 覆盖占位区域。`{% include %}` 用于引入可复用的页面片段。

## 静态文件管理

在开发环境中，Django 会自动服务 `static/` 目录下的文件。生产环境需要用 `collectstatic` 收集到统一目录：

```bash
python manage.py collectstatic
```

在 `settings.py` 中配置静态文件路径：

```python
STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'  # collectstatic 目标目录
STATICFILES_DIRS = [BASE_DIR / 'static']  # 开发时静态文件位置
```

## 实际开发中的应用 / 常见问题

**Django ORM 的 N+1 查询问题**：在模板中遍历外键对象时，如果不使用 `select_related`/`prefetch_related`，每次访问关联对象都会触发一次数据库查询。推荐使用 Django Debug Toolbar 监控 SQL 查询数量，及早发现 N+1 问题。

**Django 适合什么场景**：Django 最适合需要管理后台和数据模型较多的传统 Web 应用，如内容管理系统、SaaS 平台、企业内部系统。对于轻量 API 或微服务，可以考虑 FastAPI 或 Flask 以避免 Django 的全栈框架开销。

**迁移文件的处理**：Django 迁移文件（`migrations/` 目录）是数据库结构的版本控制，应当提交到 Git。在多分支开发时，务必注意迁移依赖顺序，合并冲突时按时间线重新生成比手动合并更安全。
