---
title: Flask 轻量 Web 框架入门
category: python
level: beginner
readMinutes: 16
tags: "Flask, 路由, 模板, WSGI"
summary: Flask 轻量 Web 框架入门：路由、模板渲染与请求处理。
order: 20
prereq: python/py-basics
---

Flask 是一个用 Python 编写的轻量级 Web 框架，基于 Werkzeug WSGI 工具包和 Jinja2 模板引擎。它的设计哲学是"微框架"——核心足够简单，但通过丰富的扩展生态可以构建任何规模的 Web 应用。

## Flask 最小应用

一个 Flask 应用的最小结构只需要几行代码：

```python
from flask import Flask

app = Flask(__name__)

@app.route('/')
def hello():
    return 'Hello, World!'

if __name__ == '__main__':
    app.run(debug=True)
```

**注意**：`debug=True` 开启了调试模式，代码修改后会自动重载，但生产环境务必关闭。

## 路由与变量规则

`@app.route()` 装饰器将 URL 路径绑定到视图函数。Flask 支持动态路由变量：

```python
@app.route('/user/<username>')
def show_user(username):
    return f'User: {username}'

@app.route('/post/<int:post_id>')  # 类型转换器：int/float/path/string/uuid
def show_post(post_id):
    return f'Post: {post_id}'
```

Flask 内置了 `string`（默认）、`int`、`float`、`path`（含斜杠）、`uuid` 五种转换器。你也可以自定义转换器来处理复杂的 URL 规则。

## 请求对象

Flask 的 `request` 对象是线程隔离的全局变量，自动对应当前请求上下文，无需作为参数传递：

```python
from flask import Flask, request, jsonify

app = Flask(__name__)

@app.route('/search')
def search():
    # 获取 URL 查询参数 ?q=xxx&page=1
    q = request.args.get('q', '')
    page = request.args.get('page', 1, type=int)
    return f'搜索: {q}, 第 {page} 页'

@app.route('/login', methods=['POST'])
def login():
    # 获取表单数据
    username = request.form.get('username')
    # 获取 JSON 请求体（Content-Type: application/json）
    data = request.get_json()
    return jsonify({'status': 'ok', 'user': username})
```

**注意**：`request.get_json()` 会解析 `application/json` 类型的请求体，而 `request.form` 用于表单提交。两者不要混用。

## 响应与 jsonify

Flask 视图函数可以返回字符串、元组 `(body, status, headers)` 或 Response 对象。对于 API 开发，`jsonify` 是最常用的响应方式：

```python
from flask import jsonify, make_response

@app.route('/api/data')
def get_data():
    resp = make_response(jsonify({'name': 'Flask', 'version': '3.0'}))
    resp.headers['X-Custom-Header'] = 'value'
    resp.status_code = 200
    return resp
```

## Jinja2 模板基础

Flask 默认使用 Jinja2 模板引擎，模板文件存放在 `templates/` 目录下：

```html
<!-- templates/base.html -->
<!DOCTYPE html>
<html>
<head><title>{% block title %}默认标题{% endblock %}</title></head>
<body>
    {% block content %}{% endblock %}
</body>
</html>

<!-- templates/index.html -->
{% extends "base.html" %}
{% block title %}首页{% endblock %}
{% block content %}
    <h1>欢迎, {{ username }}</h1>
    <ul>
    {% for item in items %}
        <li>{{ item.name }}</li>
    {% endfor %}
    </ul>
{% endblock %}
```

渲染模板时传入上下文变量：

```python
@app.route('/')
def index():
    return render_template('index.html',
        username='Alice',
        items=[{'name': '文章1'}, {'name': '文章2'}]
    )
```

Jinja2 自动对变量进行 HTML 转义，防止 XSS 攻击。如需渲染原始 HTML，使用 `{{ content|safe }}`，但务必确保内容已消毒。

## Blueprint 蓝图模块化

当应用规模增大时，Blueprint 可以将路由按功能拆分为独立模块：

```python
# auth.py
from flask import Blueprint

auth_bp = Blueprint('auth', __name__, url_prefix='/auth')

@auth_bp.route('/login')
def login():
    return '登录页面'

@auth_bp.route('/register')
def register():
    return '注册页面'

# app.py
from flask import Flask
from auth import auth_bp

app = Flask(__name__)
app.register_blueprint(auth_bp)
```

每个 Blueprint 可以有独立的模板目录和静态文件目录，真正实现模块化开发。

## Flask 中间件 / 钩子

Flask 提供了多个请求生命周期钩子，可以在请求处理前后插入自定义逻辑：

```python
@app.before_request
def before_request():
    # 每次请求前执行，如身份验证
    g.user = get_current_user()

@app.after_request
def after_request(response):
    # 请求处理后、响应发出前执行
    response.headers['X-Processed-By'] = 'Flask'
    return response

@app.teardown_request
def teardown_request(exception):
    # 响应发出后执行（即使发生异常也会执行）
    db_session.remove()
```

`g` 对象是请求级别的全局变量，用于在同一请求内的多个函数间传递数据。

## 开发服务器与生产部署

Flask 内置的开发服务器 `app.run()` 仅用于开发。生产环境需要使用 WSGI 服务器：

```bash
# 安装 gunicorn
pip install gunicorn

# 启动（app 是模块名，app 是 Flask 实例变量名）
gunicorn -w 4 -b 0.0.0.0:8000 app:app
```

`-w 4` 表示启动 4 个 worker 进程。对于 CPU 密集型可以用 `gunicorn -k gevent` 切换到异步 worker。

## 实际开发中的应用 / 常见问题

**如何组织大型 Flask 项目**：推荐按功能模块划分 Blueprint，每个 Blueprint 有独立的 `views.py`、`models.py`、`templates/`。公共组件放在 `core/` 或 `common/` 目录下。

**Flask 线程安全吗**：Flask 使用 Werkzeug 的 LocalProxy 机制，`request` 和 `g` 对象是线程隔离的，在多线程环境下天然安全。但需要注意，如果使用了全局变量存储可变状态（如字典、列表），则需要手动加锁。

**何时用 Flask vs FastAPI**：如果项目以服务端渲染的 Web 页面为主，Flask + Jinja2 生态成熟；如果是纯 API 服务且需要异步支持，FastAPI 更合适。Flask 在简单性和扩展性之间取得了很好的平衡。
