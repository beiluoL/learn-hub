---
title: 序列化
category: java
module: java-io
subcat: roadmap
timeline: false
level: medium
tier: key
readMinutes: 12
tags: 异常与 IO
summary: 对象序列化与反序列化、transient 控制。
order: 6
---

- 实现 `Serializable` 接口即可序列化。
- `ObjectOutputStream / ObjectInputStream` 读写对象。
- `transient` 字段不参与序列化（如密码）。
- `serialVersionUID` 保证版本兼容。
- JSON 序列化（Jackson）更通用、跨语言。

**自查清单**
- [ ] 理解序列化用途
- [ ] 会用 transient
- [ ] 知道 serialVersionUID
