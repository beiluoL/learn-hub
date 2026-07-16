---
title: Python 设计模式实战
category: python
level: intermediate
readMinutes: 18
tags: "设计模式, 单例, 工厂, 装饰器"
summary: Python 设计模式实战。
order: 30
prereq: python/py-basics
---

设计模式是经过验证的代码组织经验。Python 的灵活特性让很多经典设计模式的实现方式与 Java/C++ 截然不同——有些模式在 Python 中变得极其简单甚至不必要，有些则形成了 Pythonic 的独特实现方式。

## 单例模式（四种写法）

```python
# 方式一：模块级单例（Pythonic，最推荐）
# config.py
class AppConfig:
    def __init__(self):
        self.debug = True
        self.db_url = 'sqlite:///app.db'

config = AppConfig()  # 模块导入时即创建，天然单例
# 使用：from config import config

# 方式二：__new__ 方法
class Singleton:
    _instance = None

    def __new__(cls, *args, **kwargs):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

# 方式三：元类
class SingletonMeta(type):
    _instances = {}

    def __call__(cls, *args, **kwargs):
        if cls not in cls._instances:
            cls._instances[cls] = super().__call__(*args, **kwargs)
        return cls._instances[cls]

class Database(metaclass=SingletonMeta):
    def __init__(self):
        self.connection = create_connection()

# 方式四：装饰器
def singleton(cls):
    instances = {}
    def get_instance(*args, **kwargs):
        if cls not in instances:
            instances[cls] = cls(*args, **kwargs)
        return instances[cls]
    return get_instance

@singleton
class Cache:
    def __init__(self):
        self.data = {}
```

**注意**：Python 中模块级变量是最简单、最 Pythonic 的单例实现。元类和 `__new__` 版本在继承和多线程场景下需要额外处理。元类版本天然线程安全，但不支持 `__init__` 参数变化。

## 工厂模式与注册表

```python
class PaymentProcessor:
    """支付处理器基类"""
    def pay(self, amount: float) -> bool:
        raise NotImplementedError

class AlipayProcessor(PaymentProcessor):
    def pay(self, amount: float) -> bool:
        print(f'支付宝支付: {amount}')
        return True

class WechatProcessor(PaymentProcessor):
    def pay(self, amount: float) -> bool:
        print(f'微信支付: {amount}')
        return True

# 注册表模式：自动注册子类
class PaymentFactory:
    _processors: dict[str, type[PaymentProcessor]] = {}

    @classmethod
    def register(cls, name: str):
        """装饰器：将类注册到工厂"""
        def decorator(processor_cls):
            cls._processors[name] = processor_cls
            return processor_cls
        return decorator

    @classmethod
    def create(cls, name: str) -> PaymentProcessor:
        processor_cls = cls._processors.get(name)
        if not processor_cls:
            raise ValueError(f'未知支付方式: {name}')
        return processor_cls()

# 使用
@PaymentFactory.register('alipay')
class AlipayV2(PaymentProcessor):
    def pay(self, amount):
        print(f'支付宝 V2 支付: {amount}')
        return True

processor = PaymentFactory.create('alipay')
processor.pay(100)
```

这种"注册表 + 工厂"的组合在插件系统中广泛使用，如 Web 框架的中间件注册、ORM 的字段类型注册等。

## 观察者模式

```python
class Event:
    def __init__(self):
        self._listeners = []

    def subscribe(self, listener):
        self._listeners.append(listener)
        return lambda: self._listeners.remove(listener)  # 返回取消订阅函数

    def emit(self, *args, **kwargs):
        for listener in self._listeners:
            listener(*args, **kwargs)

# 使用
order_created = Event()

# 订阅
unsub1 = order_created.subscribe(lambda order: print(f'发送邮件: {order["id"]}'))
unsub2 = order_created.subscribe(lambda order: print(f'更新库存: {order["id"]}'))

# 触发
order_created.emit({'id': 'ORD-001', 'amount': 299})

# 取消订阅
unsub1()
```

Python 原生的观察者模式只需简单的列表回调即可实现。对于更复杂的事件总线需求，可使用 `blinker` 或 `pyee` 库。

## 策略模式

```python
from abc import ABC, abstractmethod

class DiscountStrategy(ABC):
    @abstractmethod
    def calculate(self, price: float) -> float:
        pass

class NoDiscount(DiscountStrategy):
    def calculate(self, price: float) -> float:
        return price

class PercentageDiscount(DiscountStrategy):
    def __init__(self, percent: float):
        self.percent = percent

    def calculate(self, price: float) -> float:
        return price * (1 - self.percent)

class FixedDiscount(DiscountStrategy):
    def __init__(self, amount: float):
        self.amount = amount

    def calculate(self, price: float) -> float:
        return max(0, price - self.amount)

class Order:
    def __init__(self, price: float, discount: DiscountStrategy | None = None):
        self.price = price
        self.discount = discount or NoDiscount()

    def final_price(self) -> float:
        return self.discount.calculate(self.price)

# 运行时切换策略
order = Order(100, FixedDiscount(20))
print(order.final_price())  # 80

order.discount = PercentageDiscount(0.15)
print(order.final_price())  # 85
```

Python 中函数是一等公民，简单的策略可以直接用普通函数替代类：

```python
def no_discount(price):
    return price

def half_off(price):
    return price * 0.5

# 策略字典
strategies = {'none': no_discount, 'half': half_off}
final = strategies.get('half', no_discount)(100)
```

## 上下文管理器协议

上下文管理器是 Python 对"资源获取即初始化"（RAII）模式的实现：

```python
class DatabaseConnection:
    def __init__(self, url: str):
        self.url = url
        self.conn = None

    def __enter__(self):
        print('连接数据库...')
        self.conn = create_connection(self.url)
        return self.conn

    def __exit__(self, exc_type, exc_val, exc_tb):
        print('关闭数据库连接')
        if self.conn:
            self.conn.close()
        return False  # 不抑制异常

# 使用
with DatabaseConnection('postgresql://...') as conn:
    conn.execute('SELECT ...')

# 生成器版本（更简洁）
from contextlib import contextmanager

@contextmanager
def db_connection(url: str):
    conn = create_connection(url)
    try:
        yield conn
    finally:
        conn.close()
```

## 实际开发中的应用 / 常见问题

**设计模式在 Python 中的角色**：Python 的动态特性（一等函数、鸭子类型、描述符）让很多经典设计模式变得透明。策略模式可直接用函数替代；观察者模式的核心就是回调列表；装饰器模式是 Python 的语法特性。不要为了"使用设计模式"而使用——代码简洁和可读性永远是第一位的。

**依赖注入 vs 全局变量**：简单项目用模块级全局对象（如 config）即可；中型项目用 FastAPI 的 Depends 或手动构造函数注入；大型项目使用 `dependency-injector` 等 DI 框架。避免 `import *` 和循环导入，这两种问题在依赖管理不当的代码库中频繁出现。

**何时必须使用模式**：当代码中出现 switch/if-else 分支按类型分发，或模板方法重复度高时，策略模式、工厂模式可以消除条件分支；当需要跨模块解耦通信时，观察者/事件总线模式是自然选择。
