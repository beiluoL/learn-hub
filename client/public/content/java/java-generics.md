---
title: 泛型与通配符：PECS 原则
category: java
level: intermediate
readMinutes: 10
tags: 泛型, 类型安全, PECS
summary: 理解类型擦除、上下界通配符，掌握"生产者 extends、消费者 super"的 PECS 原则。
order: 8
prereq: java/java-oop, java/java-collections
---

# 泛型与通配符：PECS 原则

泛型让集合与 API 在编译期就保证类型安全，避免强制转换和运行时 `ClassCastException`。

## 一、类型擦除

Java 泛型是**编译期**特性：编译后类型参数被擦除为原始类型（或上界）。因此 `List<String>` 和 `List<Integer>` 运行时是同一个类。

```java
List<String> a = new ArrayList<>();
List<Integer> b = new ArrayList<>();
System.out.println(a.getClass() == b.getClass()); // true
```

## 二、通配符与 PECS

- `? extends T`：上界，只能读（生产者 Producer）
- `? super T`：下界，只能写（消费者 Consumer）

> **PECS 口诀**：Producer-Extends, Consumer-Super。

```java
// 从 src 读数据（生产者）→ extends；往 dst 写数据（消费者）→ super
public static <T> void copy(List<? extends T> src, List<? super T> dst) {
    for (T item : src) {
        dst.add(item);
    }
}
```

## 三、常见约束

| 写法 | 能读 | 能写 | 适用 |
| --- | --- | --- | --- |
| `List<T>` | ✅ | ✅ | 明确类型 |
| `List<? extends T>` | ✅（当 T） | ❌ | 只取不放 |
| `List<? super T>` | ❌（当 Object） | ✅ | 只放不取 |

## 四、泛型方法与边界

```java
public static <T extends Comparable<T>> T max(List<T> list) {
    T best = list.get(0);
    for (T t : list) if (t.compareTo(best) > 0) best = t;
    return best;
}
```

> 记住：需要"往里灌"用 super，需要"往外取"用 extends，两者都要则用确定类型 T。
