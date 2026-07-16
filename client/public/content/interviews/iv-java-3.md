---
question: JVM 内存结构是怎样的？哪些区域会发生 OOM？
category: java
difficulty: middle
tags: "JVM, 内存, OOM"
order: 3
---

**运行时数据区：**堆、方法区(元空间)、虚拟机栈、本地方法栈、程序计数器。

-   堆 OOM：对象过多且无法回收（内存泄漏/堆太小）
-   元空间 OOM：加载的类过多（如动态代理、热部署）
-   虚拟机栈 OOM/StackOverflow：递归过深（StackOverflowError）、线程数过多（栈内存耗尽）
-   程序计数器不会发生 OOM
