---
question: Python 的内存管理与垃圾回收机制是怎样的？
category: python
difficulty: middle
tags: 内存管理, GC, 引用计数
order: 16
---

CPython 采用**引用计数为主、分代回收为辅**的策略。

**引用计数：**每个对象记录被引用的次数，计数归零立即回收。优点是实时、简单；缺点是无法处理循环引用。

```python
import sys
a = []
print(sys.getrefcount(a))  # 比实际多 1（getrefcount 自身持有引用）
```

**循环引用问题：**两个对象互相引用，计数永远不为 0：

```python
a = {}; b = {}
a['b'] = b; b['a'] = a   # 互相引用，引用计数无法回收
```

**分代回收（gc 模块）：**为解决循环引用，CPython 引入标记-清除 + 分代收集。对象按存活时间分 0/1/2 三代，越老的代回收频率越低（基于"大部分对象很快死亡"的弱代假设）。

```python
import gc
gc.collect()          # 手动触发回收
gc.disable()          # 高性能场景可临时关闭
```

**补充要点：**

- 小整数（-5~256）和短字符串会被**驻留（intern）**复用。
- `__del__` 中的循环引用可能让对象无法回收，应避免。
- 内存不会立即还给操作系统，CPython 有内存池（pymalloc）。
