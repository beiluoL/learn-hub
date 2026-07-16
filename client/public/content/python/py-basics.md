---
title: Python 基础语法与数据结构
category: python
level: beginner
readMinutes: 12
tags: "基础, 数据类型, 语法"
summary: 掌握变量、缩进、内置数据结构与推导式，建立 Python 直觉。
order: 1
---

## 一、变量与动态类型

Python 是动态强类型语言，变量无需声明类型，但类型本身是严格的：

```
name = "Tom"        # str
age = 18            # int
scores = [90, 85]   # list
age = "18"          # 允许重新绑定为 str（弱约定，不推荐）
```

注意：`is` 比较身份（内存地址），`==` 比较值。小整数（-5~256）和短字符串有驻留（interning）缓存。

## 二、核心数据结构

| 类型 | 特点 | 示例 |
| --- | --- | --- |
| list | 有序可变，可重复 | `[1, 2, 2]` |
| tuple | 有序不可变 | `(1, 2)` |
| set | 无序去重 | `{1, 2}` |
| dict | 键值映射（3.7+ 保序） | `{"a": 1}` |

## 三、推导式（Comprehension）

用一行生成容器，可读且高效：

```
squares = [x*x for x in range(10) if x % 2 == 0]
mapped = {k: v*2 for k, v in {"a": 1}.items()}
evens = {x for x in range(10) if x % 2 == 0}
```

## 四、控制流与函数

```
def greet(name, *, loud=False):   # * 后为仅关键字参数
    msg = f"Hello, {name}"
    return msg.upper() if loud else msg

for i in range(3):
    print(i)
[x for x in range(3)]
```
