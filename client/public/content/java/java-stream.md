---
title: Java 8+ 新特性：Lambda 与 Stream
category: java
level: intermediate
readMinutes: 13
tags: "Java8, Lambda, Stream, 函数式"
summary: 用 Lambda 与 Stream 写出声明式、易并行的高可读代码。
order: 6
---

## 一、Lambda 表达式

函数式接口（仅一个抽象方法，标注 `@FunctionalInterface`）可用 Lambda 简写：

```
List<Integer> nums = Arrays.asList(3, 1, 2);
nums.sort((a, b) -> a - b);          // 替代匿名内部类
Runnable r = () -> System.out.println("hi");
```

## 二、Stream 流式处理

把集合转为流，链式声明"做什么"而非"怎么做"：

```
List<String> result = users.stream()
    .filter(u -> u.getAge() >= 18)
    .map(User::getName)
    .sorted()
    .collect(Collectors.toList());
```

-   **中间操作**（惰性）：filter / map / flatMap / distinct / sorted
-   **终止操作**（触发）：collect / forEach / count / reduce

并行流 `parallelStream()` 利用 ForkJoinPool，但要注意线程安全与共享可变状态。

## 三、其他实用新特性

-   `Optional`：优雅处理 null，避免 NPE
-   `var`（Java 10）：局部变量类型推断
-   record（Java 16）：不可变数据载体，自动生成构造/getter/equals
-   文本块（Java 15+）：`"""..."""` 多行字符串

```
record Point(int x, int y) {}
Optional.ofNullable(name).ifPresent(System.out::println);
```
