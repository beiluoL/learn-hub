---
question: Python 中 list 和 tuple 的区别？什么场景用 tuple？
category: python
difficulty: middle
tags: "数据类型, 性能"
order: 4
---

**区别：**list 可变（可增删改），tuple 不可变（创建后不能改）。

**用 tuple 的场景：**

-   数据不应被修改（如配置、坐标），不可变更安全
-   作为 dict 的 key（tuple 可哈希，list 不行）
-   性能略好、内存更小（结构更简单）
-   函数返回多个值本质就是返回 tuple
