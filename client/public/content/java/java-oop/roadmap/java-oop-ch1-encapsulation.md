---
title: 封装
category: java
module: java-oop
subcat: roadmap
timeline: false
level: easy
tier: core
readMinutes: 12
tags: 面向对象
summary: 用 private 隐藏细节，通过 getter/setter 暴露可控访问。
order: 2
---

- `private` 修饰字段，外部无法直接访问。
- 提供 `getXxx()/setXxx()` 进行受控读写。
- 可在 setter 中做校验（如年龄不能为负）。
- 封装降低耦合，提高可维护性。
- 访问修饰符：`private < 默认 < protected < public`。

**自查清单**
- [ ] 能给字段加 private
- [ ] 会写 getter/setter
- [ ] 理解封装收益
