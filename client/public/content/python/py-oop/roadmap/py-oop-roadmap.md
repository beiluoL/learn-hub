---
title: 面向对象 · 系统学习路线
category: python
module: py-oop
subcat: roadmap
timeline: true
level: medium
tier: core
readMinutes: 12
tags: "面向对象, 学习路线, 路线图"
summary: 从总览到逐章拆解的 面向对象 学习路线，点开任意章节开始学习。
order: 0
---

这份路线把「面向对象」拆成 7 个阶段，每个阶段给出**核心任务**与**练手目标**。建议边看边敲，每完成一项就勾掉一项。

## 0. 类与对象

用 class 封装数据与行为

- [ ] 能定义类并创建实例
- [ ] 理解 self 作用

## 1. 实例、类与静态方法

区分三种方法装饰器

- [ ] 会用 staticmethod
- [ ] 理解 classmethod 的 cls

## 2. 继承与多态

子类复用并扩展父类

- [ ] 能实现子类重写
- [ ] 理解 super()
- [ ] 用 isinstance 判断类型

## 3. 特殊方法 (dunder)

自定义对象的运算符与表现

- [ ] 自定义 __repr__
- [ ] 实现运算符重载

## 4. 属性与描述符

用 property 控制访问

- [ ] 用 property 暴露计算属性
- [ ] 理解 getter/setter

## 5. __slots__ 与性能

限制属性节省内存

- [ ] 用 __slots__ 定义类
- [ ] 理解其内存收益

## 6. dataclasses 与枚举

简化数据类与枚举定义

- [ ] 用 dataclass 定义数据类
- [ ] 用 Enum 约束取值

## 资源与节奏

- 官方文档与权威资料优先；
- 节奏：每天 1~2 小时，理论 + 敲代码交替；
- 关键：每个模块至少完成 1 个可运行的小项目，代码放仓库。
