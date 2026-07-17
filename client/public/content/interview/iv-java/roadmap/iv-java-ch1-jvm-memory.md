---
title: JVM 内存模型
category: interview
module: iv-java
subcat: roadmap
timeline: false
level: medium
tier: core
readMinutes: 10
tags: "Java 面试, JVM, 内存"
summary: 运行时数据区与对象创建的内存流转
order: 2
---

- 线程私有：程序计数器、虚拟机栈、本地方法栈
- 线程共享：堆、方法区(元空间)
- 对象创建：类加载检查→分配内存→初始化零值→设置对象头→执行 init
- 指针碰撞 vs 空闲列表，配合 CAS 或 TLAB 解决并发

```java
// 栈溢出示例
public class StackDemo {
    static void recurse() { recurse(); } // StackOverflowError
    public static void main(String[] args) {
        recurse();
    }
}
```

> 元空间使用本地内存，默认受系统限制，可配置 MaxMetaspaceSize。

**自查清单**
- [ ] 能画出运行时数据区
- [ ] 能解释 OOM 的常见区域
