---
title: 命令行 Todo 小工具
category: java
module: java-basics
subcat: cases
timeline: false
level: easy
tier: basic
readMinutes: 20
tags: "Java 基础语法, 项目案例"
summary: 用数组/集合 + 循环实现一个增删查的命令行待办列表。
order: 1
---

- 用 `List<String>` 存储任务。
- `Scanner` 读取命令（add/done/list/exit）。
- 循环驱动交互，直到 exit。
- （进阶）把任务持久化到本地文件。

```java
List<String> tasks = new ArrayList<>();
Scanner sc = new Scanner(System.in);
while (true) {
  String cmd = sc.nextLine();
  if ("exit".equals(cmd)) break;
  tasks.add(cmd);
}
```

**自查清单**
- [ ] 实现增删查
- [ ] 用循环驱动交互
- [ ] 代码可运行
