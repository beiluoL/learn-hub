---
title: 单元测试：pytest 实战
category: python
level: intermediate
readMinutes: 10
tags: 测试, pytest, fixture, mock
summary: 用 pytest 写清爽的测试，掌握 fixture、参数化与 mock，建立可靠的测试习惯。
order: 7
prereq: python/py-basics
---

# 单元测试：pytest 实战

`pytest` 是 Python 事实标准的测试框架：断言直接用 `assert`，无需记忆一堆 `assertEqual`。

## 一、第一个测试

```python
# test_calc.py
def add(a, b):
    return a + b

def test_add():
    assert add(2, 3) == 5
    assert add(-1, 1) == 0
```

```bash
pip install pytest
pytest -v
```

## 二、fixture：复用测试前置

```python
import pytest

@pytest.fixture
def db():
    conn = connect()      # setup
    yield conn            # 提供给测试
    conn.close()          # teardown

def test_query(db):
    assert db.query("SELECT 1") == 1
```

## 三、参数化：一份逻辑多组数据

```python
@pytest.mark.parametrize("a,b,expected", [
    (1, 2, 3),
    (0, 0, 0),
    (-1, 1, 0),
])
def test_add(a, b, expected):
    assert add(a, b) == expected
```

## 四、mock：隔离外部依赖

```python
from unittest.mock import patch

def test_fetch(monkeypatch):
    with patch("mymod.requests.get") as m:
        m.return_value.json.return_value = {"ok": True}
        assert fetch_status() is True
```

## 五、常用技巧

| 需求 | 做法 |
| --- | --- |
| 期望抛异常 | `with pytest.raises(ValueError):` |
| 只跑某类 | `pytest -k "add"` |
| 覆盖率 | `pytest --cov=mymod` |

> 好测试的三要素：快、可重复、只测一件事。先写会失败的测试，再让它通过。
