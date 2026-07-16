---
title: 类型注解与 dataclass
category: python
level: intermediate
readMinutes: 9
tags: 类型注解, dataclass, 静态检查
summary: 用类型提示提升可读性与工具支持，用 dataclass 优雅地定义数据类。
order: 6
prereq: python/py-basics
---

# 类型注解与 dataclass

Python 是动态类型，但类型注解（Type Hints）能让 IDE 补全更准、配合 mypy 做静态检查、让代码更易维护。注解**不影响运行**，只是元信息。

## 一、基础注解

```python
def greet(name: str, times: int = 1) -> str:
    return (f"Hello {name}! " * times).strip()

scores: dict[str, int] = {"math": 90}
nums: list[int] = [1, 2, 3]
```

## 二、常用类型工具

| 写法 | 含义 |
| --- | --- |
| `Optional[X]` / `X \| None` | 可能为 None |
| `Union[A, B]` / `A \| B` | 多种类型之一 |
| `list[X]` `dict[K, V]` | 容器泛型 |
| `Callable[[int], str]` | 函数类型 |
| `Literal["a", "b"]` | 字面量枚举 |

```python
from typing import Optional

def find_user(uid: int) -> Optional[str]:
    return {1: "Alice"}.get(uid)
```

## 三、dataclass：告别样板代码

`@dataclass` 自动生成 `__init__`、`__repr__`、`__eq__`：

```python
from dataclasses import dataclass, field

@dataclass
class User:
    name: str
    age: int = 0
    tags: list[str] = field(default_factory=list)  # 可变默认值必须用 factory

u = User("Alice", 30)
print(u)  # User(name='Alice', age=30, tags=[])
```

- `frozen=True` 让实例不可变（可哈希，能做 dict key）。
- `field(default_factory=...)` 避免可变默认值共享的经典坑。

## 四、静态检查

```bash
pip install mypy
mypy your_module.py
```

> 注解是"写给人和工具看的合同"，运行时不强制；配合 mypy 才能真正拦住类型 bug。
