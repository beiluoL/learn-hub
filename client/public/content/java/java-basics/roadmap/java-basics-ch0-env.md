---
title: 环境与第一个程序
category: java
module: java-basics
subcat: roadmap
timeline: false
level: easy
tier: basic
readMinutes: 12
tags: Java 基础语法
summary: 搭建 JDK 环境，理解编译运行流程，写出第一个 Java 程序。
order: 1
---

Java 是编译型 + 解释型结合的语言：源码 `.java` 先编译成字节码 `.class`，再由 JVM 解释执行。

- JDK / JRE / JVM 的关系：JDK 含编译器，JRE 含运行环境，JVM 是跨平台核心。
- 配置 `JAVA_HOME` 与 `PATH`，用 `java -version` 验证。
- `public static void main(String[] args)` 是程序入口。
- 编译 `javac Hello.java` → 运行 `java Hello`（不带 .class）。
- 包（package）对应目录结构，`import` 引入其他类。

```java
public class Hello {
  public static void main(String[] args) {
    System.out.println("Hello, Java!");
  }
}
```

**自查清单**
- [ ] 装好 JDK 并配置环境变量
- [ ] 能独立编译运行 Hello World
- [ ] 理解包与目录的对应关系
