---
title: 入门与配置
category: java
module: java-mybatis
subcat: roadmap
timeline: false
level: medium
tier: basic
readMinutes: 12
tags: MyBatis
summary: SqlSessionFactory、映射文件与 Mapper 接口。
order: 1
---

- 核心对象：`SqlSessionFactory` → `SqlSession`。
- Mapper 接口 + XML/注解映射 SQL。
- `mybatis-config.xml` 配置数据源、别名、映射。
- Spring 整合后由容器管理 SqlSession。
- `#{}` 预编译占位，`${}` 拼接（慎用）。

```xml
<select id="findById" resultType="User">
  SELECT * FROM user WHERE id = #{id}
</select>
```

**自查清单**
- [ ] 理解核心对象
- [ ] 能配 SqlSessionFactory
- [ ] 区分 # 与 $
