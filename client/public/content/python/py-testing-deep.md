---
title: Python 测试进阶：pytest 高级特性与 Mock 实战
category: python
level: intermediate
readMinutes: 18
tags: "pytest, mock, fixture, 覆盖率"
summary: Python 测试进阶：pytest 高级特性与 Mock 实战。
order: 31
prereq: python/py-testing
---

pytest 是 Python 生态中最流行的测试框架，它以简洁的断言语法、强大的 fixture 机制和丰富的插件生态，成为测试编写的事实标准。本文聚焦于进阶特性，帮助你从"能写测试"到"写好测试"。

## Fixture Scope 与 conftest.py

Fixture 是 pytest 的核心，用于管理测试的依赖注入：

```python
# conftest.py — 测试配置，自动被同目录及子目录的测试文件发现
import pytest
from myapp import create_app, db

@pytest.fixture(scope='session')
def app():
    """Session 级别：整个测试会话只创建一次"""
    app = create_app(config='testing')
    with app.app_context():
        db.create_all()
        yield app
        db.drop_all()

@pytest.fixture(scope='function')
def client(app):
    """Function 级别：每个测试函数都获取新实例"""
    return app.test_client()

@pytest.fixture(scope='module')
def sample_data(app):
    """Module 级别：同一模块内共享"""
    user = User(name='Test User', email='test@example.com')
    db.session.add(user)
    db.session.commit()
    return {'user': user}
```

**Fixture Scope 对比**：

| Scope | 生命周期 | 使用场景 |
|-------|---------|---------|
| `function`（默认） | 每个测试函数 | 需要隔离的测试数据 |
| `class` | 每个测试类 | 共享的昂贵初始化 |
| `module` | 每个模块 | 模块级测试数据准备 |
| `package` | 每个包 | 包级公共资源 |
| `session` | 整个测试会话 | 数据库引擎、应用实例 |

## Parametrize：参数化测试

参数化让同一个测试函数覆盖多组输入，避免代码重复：

```python
import pytest

@pytest.mark.parametrize('a, b, expected', [
    (1, 2, 3),
    (0, 0, 0),
    (-1, 1, 0),
    (100, 200, 300),
])
def test_add(a, b, expected):
    assert a + b == expected

# 参数组合
@pytest.mark.parametrize('role', ['admin', 'user', 'guest'])
@pytest.mark.parametrize('method', ['GET', 'POST'])
def test_endpoint_access(client, role, method):
    """3 x 2 = 6 个测试用例，无需手写 6 个函数"""
    response = client.open('/api/data', method=method, headers={'X-Role': role})
    assert response.status_code in (200, 403)
```

间接参数化（indirect）让参数先经过 fixture 处理：

```python
@pytest.fixture
def user(request):
    """根据参数创建不同角色的用户"""
    role = request.param
    return User(name=role, role=role)

@pytest.mark.parametrize('user', ['admin', 'editor'], indirect=True)
def test_permissions(client, user):
    login_as(client, user)
    # ...
```

## Mock 外部依赖

Mock 是测试依赖外部服务的代码的核心技术：

```python
from unittest.mock import Mock, patch, MagicMock

# 方式一：patch 装饰器（推荐）
@patch('mymodule.requests.get')
def test_fetch_data(mock_get):
    # 配置 mock 的返回值
    mock_get.return_value.json.return_value = {'status': 'ok'}
    mock_get.return_value.status_code = 200

    result = fetch_user_data('https://api.example.com/user/1')
    assert result['status'] == 'ok'
    mock_get.assert_called_once_with('https://api.example.com/user/1')

# 方式二：patch 上下文管理器
def test_send_notification():
    with patch('mymodule.send_email') as mock_send:
        mock_send.return_value = True
        result = register_user('alice@example.com')
        mock_send.assert_called_once()

# 方式三：MagicMock 快速构造复杂对象
def test_complex_interaction():
    db = MagicMock()
    db.query.return_value.filter.return_value.first.return_value = User(name='Alice')
    result = get_user(db, 1)
    assert result.name == 'Alice'
```

**注意**：patch 的参数是调用处的完整模块路径（`mymodule.requests.get`），而非被 patched 对象的定义位置。理解这个"where it's used"原则是避免 Mock 失效的关键。

## 数据库测试策略

数据库测试有三种主流策略：

```python
# 策略一：SQLite 内存数据库（最快，但不完全等价于生产环境）
@pytest.fixture(scope='session')
def engine():
    return create_engine('sqlite:///:memory:', echo=False)

# 策略二：事务回滚（每个测试在独立事务中，完成后回滚）
@pytest.fixture
def db_session(engine):
    connection = engine.connect()
    transaction = connection.begin()
    session = Session(bind=connection)
    yield session
    session.close()
    transaction.rollback()  # 关键：回滚，不写磁盘
    connection.close()

# 策略三：临时 PostgreSQL（最接近生产）
# 使用 pytest-postgresql 或 testcontainers
```

事务回滚策略是平衡速度和真实性的最佳实践——每个测试的操作在隔离事务中执行，测试结束后回滚，数据库保持"干净"状态。

## 测试覆盖率 pytest-cov

```bash
# 安装
pip install pytest-cov

# 运行并生成覆盖率报告
pytest --cov=myapp --cov-report=term --cov-report=html

# 覆盖率达到 80% 才通过（CI 中使用）
pytest --cov=myapp --cov-fail-under=80
```

覆盖率报告显示每行代码是否被测试执行。但覆盖率不等于测试质量——100% 覆盖率的代码仍可能隐藏边界条件 bug。

## CI 集成示例

```yaml
# .github/workflows/test.yml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: '3.12'
      - run: pip install poetry && poetry install
      - run: poetry run pytest --cov --cov-fail-under=80
      - run: poetry run ruff check .
```

## TDD 示例

TDD（测试驱动开发）的经典三步循环：Red -> Green -> Refactor。

```python
# Step 1: Red — 先写测试（此时函数不存在）
def test_calculate_discount_vip():
    assert calculate_discount('vip', 100) == 80
    assert calculate_discount('vip', 200) == 160

def test_calculate_discount_regular():
    assert calculate_discount('regular', 100) == 95

# Step 2: Green — 实现最小可行代码让测试通过
def calculate_discount(user_type, price):
    if user_type == 'vip':
        return price * 0.8
    return price * 0.95

# Step 3: Refactor — 优化代码结构，测试保证不破坏已有功能
# 添加边界测试后重构
def test_calculate_discount_negative():
    with pytest.raises(ValueError):
        calculate_discount('vip', -100)
```

## 测试可维护性

遵循 **AAA 模式（Arrange-Act-Assert）** 和清晰的命名：

```python
# 测试函数命名：test_<被测方法>_<场景>_<预期行为>
def test_calculate_tax_high_income_applies_higher_rate():
    # Arrange（准备）
    income = 200000
    expected_tax = 30000

    # Act（执行）
    result = calculate_tax(income)

    # Assert（断言）
    assert result == expected_tax
```

## 实际开发中的应用 / 常见问题

**什么代码需要测试**：业务逻辑（计算、校验、状态转换）必须测试；简单的 getter/setter 和框架胶水代码可以跳过；外部 API 调用用 Mock；数据库操作用事务回滚或临时库。一个实用的经验法则是：如果这段代码在生产环境出错会让你凌晨被叫醒，那就应该写测试。

**Mock 使用原则**：只 Mock 外部边界（HTTP 调用、文件系统、数据库连接），不要 Mock 领域对象和内部函数。过度 Mock 会导致测试和实现强耦合，重构时测试大范围失效。

**测试时间的优化**：使用 `pytest-xdist` 并行执行测试（`pytest -n auto`）；将慢速测试标记为 `@pytest.mark.slow` 并在 commit 前单独运行；session 级别的 fixture 避免重复初始化数据库。
