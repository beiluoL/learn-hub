---
title: 动态 SQL
category: java
module: java-mybatis
subcat: roadmap
timeline: false
level: medium
tier: key
readMinutes: 12
tags: MyBatis
summary: if/choose/foreach/where/trim/set。
order: 3
---

- `<if>` 条件拼接。
- `<choose>/<when>/<otherwise>` 多选一。
- `<foreach>` 遍历（IN 查询、批量）。
- `<where>/<set>/<trim>` 智能处理前缀逗号。
- 动态 SQL 是 MyBatis 相比 JPA 的强项。

```xml
<select id="search">
  SELECT * FROM user
  <where>
    <if test="name != null">AND name = #{name}</if>
  </where>
</select>
```

**自查清单**
- [ ] 会用 if/foreach
- [ ] 理解 where 标签
- [ ] 能写动态查询
