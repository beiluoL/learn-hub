---
title: Django REST Framework API 开发
category: python
level: intermediate
readMinutes: 18
tags: "DRF, REST, Serializer, API"
summary: Django REST Framework API 开发。
order: 23
prereq: python/py-django-basics
---

Django REST Framework（DRF）是构建在 Django 之上的 RESTful API 工具包，提供了序列化器、视图集、认证鉴权、分页过滤等完整的 API 开发组件，是 Django 生态中构建 API 的事实标准。

## Serializer 与 ModelSerializer

Serializer 负责数据校验和序列化，是 DRF 最核心的概念：

```python
from rest_framework import serializers
from .models import Article, Author

class AuthorSerializer(serializers.ModelSerializer):
    article_count = serializers.SerializerMethodField()

    class Meta:
        model = Author
        fields = ['id', 'name', 'email', 'article_count']

    def get_article_count(self, obj):
        return obj.articles.count()

class ArticleSerializer(serializers.ModelSerializer):
    author_name = serializers.ReadOnlyField(source='author.name')

    class Meta:
        model = Article
        fields = ['id', 'title', 'content', 'author', 'author_name', 'created_at']
        read_only_fields = ['id', 'created_at']

    def validate_title(self, value):
        if len(value) < 5:
            raise serializers.ValidationError('标题至少 5 个字符')
        return value
```

**注意**：`source='author.name'` 可以访问关联对象的属性。`SerializerMethodField` 用于只读的计算字段。自定义 `validate_<field_name>` 方法可以为单个字段添加校验逻辑。

## ViewSet 与 Router

DRF 的 ViewSet 将一组相关视图逻辑封装在一个类中，配合 Router 自动生成 URL 配置：

```python
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

class ArticleViewSet(viewsets.ModelViewSet):
    queryset = Article.objects.all()
    serializer_class = ArticleSerializer

    def get_queryset(self):
        # 根据查询参数过滤
        qs = super().get_queryset()
        author_id = self.request.query_params.get('author')
        if author_id:
            qs = qs.filter(author_id=author_id)
        return qs

    @action(detail=True, methods=['post'])
    def publish(self, request, pk=None):
        """自定义动作：发布文章"""
        article = self.get_object()
        article.status = 'published'
        article.save()
        return Response({'status': '已发布'})

    @action(detail=False, methods=['get'])
    def recent(self, request):
        """列表级别的自定义动作"""
        qs = self.get_queryset().order_by('-created_at')[:10]
        serializer = self.get_serializer(qs, many=True)
        return Response(serializer.data)

# urls.py
from rest_framework.routers import DefaultRouter
router = DefaultRouter()
router.register(r'articles', ArticleViewSet)
urlpatterns = router.urls
```

`@action(detail=True)` 用于单个对象的额外操作（URL 含 `{pk}/`），`detail=False` 用于列表操作。

## 权限与认证

DRF 提供了多层级的权限控制机制：

```python
from rest_framework.permissions import IsAuthenticated, BasePermission
from rest_framework.authentication import TokenAuthentication

class IsAuthorOrReadOnly(BasePermission):
    """自定义权限：作者可写，其他人只读"""
    def has_object_permission(self, request, view, obj):
        if request.method in ('GET', 'HEAD', 'OPTIONS'):
            return True
        return obj.author == request.user

class ArticleViewSet(viewsets.ModelViewSet):
    authentication_classes = [TokenAuthentication]       # Token 认证
    permission_classes = [IsAuthenticated, IsAuthorOrReadOnly]
```

JWT 认证推荐使用 `djangorestframework-simplejwt` 库：

```python
from rest_framework_simplejwt.authentication import JWTAuthentication

class ArticleViewSet(viewsets.ModelViewSet):
    authentication_classes = [JWTAuthentication]
```

## 分页

DRF 内置了多种分页方式：

```python
# settings.py 全局配置
REST_FRAMEWORK = {
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 20,
}

# 视图级自定义
from rest_framework.pagination import CursorPagination

class ArticleCursorPagination(CursorPagination):
    page_size = 20
    ordering = '-created_at'

class ArticleViewSet(viewsets.ModelViewSet):
    pagination_class = ArticleCursorPagination
```

基于游标的分页（CursorPagination）适合实时数据流场景，避免翻页时出现重复或遗漏。

## 过滤与搜索

配合 `django-filter` 库实现强大的过滤功能：

```python
import django_filters
from rest_framework import filters

class ArticleFilter(django_filters.FilterSet):
    created_after = django_filters.DateTimeFilter(field_name='created_at', lookup_expr='gte')
    created_before = django_filters.DateTimeFilter(field_name='created_at', lookup_expr='lte')
    author_name = django_filters.CharFilter(field_name='author__name', lookup_expr='icontains')

    class Meta:
        model = Article
        fields = ['status', 'tags']

class ArticleViewSet(viewsets.ModelViewSet):
    filterset_class = ArticleFilter
    filter_backends = [
        django_filters.rest_framework.DjangoFilterBackend,
        filters.SearchFilter,
        filters.OrderingFilter,
    ]
    search_fields = ['title', 'content']     # 全文搜索
    ordering_fields = ['created_at', 'title']  # 排序字段
```

## APIView 定制

当 ViewSet 过于抽象时，可以使用 `APIView` 获得更细粒度的控制：

```python
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

class ArticleStatsView(APIView):
    def get(self, request):
        total = Article.objects.count()
        by_status = Article.objects.values('status').annotate(count=Count('id'))
        return Response({
            'total': total,
            'by_status': list(by_status)
        })
```

## 嵌套序列化

处理关联数据的嵌套创建和更新：

```python
class ArticleCreateSerializer(serializers.ModelSerializer):
    tags = serializers.ListField(child=serializers.CharField(), write_only=True)

    class Meta:
        model = Article
        fields = ['title', 'content', 'author', 'tags']

    def create(self, validated_data):
        tag_names = validated_data.pop('tags')
        article = Article.objects.create(**validated_data)
        for name in tag_names:
            tag, _ = Tag.objects.get_or_create(name=name)
            article.tags.add(tag)
        return article
```

## Throttling 限流

防止 API 被滥用，DRF 提供了灵活的限流机制：

```python
REST_FRAMEWORK = {
    'DEFAULT_THROTTLE_CLASSES': [
        'rest_framework.throttling.AnonRateThrottle',
        'rest_framework.throttling.UserRateThrottle',
    ],
    'DEFAULT_THROTTLE_RATES': {
        'anon': '100/day',    # 匿名用户每天 100 次
        'user': '1000/hour',  # 认证用户每小时 1000 次
    }
}
```

## 实际开发中的应用 / 常见问题

**Serializer vs ModelSerializer 选择**：当模型字段与 API 字段一一对应时使用 ModelSerializer；当需要自定义逻辑或字段映射不一致时使用 Serializer。对于复杂 API，常同时定义多个 Serializer（List/Detail/Create/Update）避免字段泄露。

**N+1 查询在 DRF 中的处理**：Serializer 中的 `source` 和 `SerializerMethodField` 可能引入 N+1 问题。在 ViewSet 的 `get_queryset` 中使用 `select_related` 和 `prefetch_related` 预加载关联数据。

**API 版本管理**：推荐使用 URL 前缀（`/api/v1/`, `/api/v2/`）进行版本控制，不同版本共用模型和数据层，只在视图和 Serializer 层体现差异。
