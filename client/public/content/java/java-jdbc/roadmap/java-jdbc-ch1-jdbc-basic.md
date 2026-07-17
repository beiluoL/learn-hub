---
title: JDBC 入门
category: java
module: java-jdbc
subcat: roadmap
timeline: false
level: medium
tier: core
readMinutes: 12
tags: 数据库与 JDBC
summary: DriverManager、Connection 与结果集。
order: 2
---

- 加载驱动（现代 JDBC 自动注册）。
- `DriverManager.getConnection(url, user, pwd)`。
- `Statement` 执行 SQL，`ResultSet` 取结果。
- URL 格式：`jdbc:mysql://host:port/db`。
- 资源必须关闭（try-with-resources）。

```java
try (Connection c = DriverManager.getConnection(url, u, p);
     Statement st = c.createStatement();
     ResultSet rs = st.executeQuery("SELECT 1")) {
  while (rs.next()) System.out.println(rs.getInt(1));
}
```

**自查清单**
- [ ] 能建立连接
- [ ] 会执行查询
- [ ] 用 try-with-resources
