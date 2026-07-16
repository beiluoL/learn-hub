---
question: 单例模式有几种实现方式？DCL 双重检查锁为什么要加 volatile？
category: java
difficulty: middle
tags: "单例模式, volatile, DCL, 设计模式"
order: 56
---

**核心结论**：单例模式常见实现方式有**饿汉式、懒汉式、静态内部类、枚举**四种，此外还有**双重检查锁（DCL）** 是懒汉式的线程安全优化版。DCL 中 `volatile` 关键字的核心作用是**禁止指令重排序**，防止在 `singleton = new Singleton()` 的过程中，因 JVM 将"分配内存→初始化对象→赋值引用"三步重排为"分配内存→赋值引用→初始化对象"，导致其他线程拿到一个尚未初始化完成的半成品对象。

## 四种单例实现方式

### 1. 饿汉式（Eager）

类加载时就完成实例化，天然线程安全，但可能造成资源浪费。

```java
public class EagerSingleton {
    private static final EagerSingleton INSTANCE = new EagerSingleton();
    private EagerSingleton() {}
    public static EagerSingleton getInstance() {
        return INSTANCE;
    }
}
```

**优点**：简单，线程安全（由类加载机制保证）。
**缺点**：实例在类加载时创建，若一直不使用则浪费内存。

### 2. 懒汉式（Lazy）

使用时才创建，需要考虑线程安全：

```java
// 有问题的版本（线程不安全）
public class LazySingleton {
    private static LazySingleton instance;
    private LazySingleton() {}
    public static LazySingleton getInstance() {
        if (instance == null) {
            instance = new LazySingleton();
        }
        return instance;
    }
}
```

上述代码在多线程下，两个线程可能同时进入 `if (instance == null)`，创建出两个不同的实例。

改进为 **synchronized 方法**：

```java
public static synchronized LazySingleton getInstance() {
    if (instance == null) {
        instance = new LazySingleton();
    }
    return instance;
}
```

**缺点**：每次调用 `getInstance` 都需要获取锁，性能差。

### 3. 双重检查锁 DCL（Double-Checked Locking）

只在第一次创建时加锁，后续直接返回：

```java
public class DclSingleton {
    private static volatile DclSingleton instance;

    private DclSingleton() {}

    public static DclSingleton getInstance() {
        if (instance == null) {                    // 第一次检查
            synchronized (DclSingleton.class) {
                if (instance == null) {            // 第二次检查
                    instance = new DclSingleton();
                }
            }
        }
        return instance;
    }
}
```

### 4. 静态内部类（推荐）

利用类加载机制实现延迟加载 + 线程安全：

```java
public class HolderSingleton {
    private HolderSingleton() {}

    private static class Holder {
        private static final HolderSingleton INSTANCE = new HolderSingleton();
    }

    public static HolderSingleton getInstance() {
        return Holder.INSTANCE;
    }
}
```

JVM 保证内部类 `Holder` 只在 `getInstance()` 首次调用时加载，且类加载过程是线程安全的。避免了 `synchronized` 的性能开销。

### 5. 枚举（最安全）

```java
public enum EnumSingleton {
    INSTANCE;

    public void doSomething() {
        // 业务方法
    }
}
```

枚举天生防止反射攻击和序列化破坏，是《Effective Java》作者 Josh Bloch 推荐的最佳单例实现方式。

## DCL 为什么要加 volatile

**理解 `new DclSingleton()` 的底层三步操作**：

JVM 层面，创建一个对象分为三个步骤（并非原子操作）：

```
1. memory = allocate()    // 在堆上分配内存空间
2. ctorInstance(memory)   // 调用构造方法，初始化对象
3. instance = memory      // 将内存地址引用赋值给 instance 变量
```

问题在于，JIT 编译器或 CPU 可能对这些操作进行**指令重排序**，优化后的执行顺序可能变为：

```
1. memory = allocate()    // 分配内存
3. instance = memory      // 赋值引用（此时对象尚未初始化！）
2. ctorInstance(memory)   // 初始化对象
```

**并发场景下的危险**：

假设线程 A 执行 DCL，刚好完成了步骤 1 和步骤 3（instance 已指向内存地址，但对象尚未初始化），此时线程 B 执行：

```java
if (instance == null)  // false! instance 非空
    // 跳过，直接返回 instance
return instance;       // 拿到未初始化的半成品对象！
```

线程 B 拿到一个尚未执行构造方法的对象，调用其方法将导致不可预期的错误。

**volatile 的作用**：

`volatile` 关键字在 JMM（Java 内存模型）中有两个核心作用：

1. **可见性**：一个线程修改 volatile 变量后，立即刷新到主内存，其他线程读取时强制从主内存读取。
2. **禁止指令重排序**：通过在 volatile 写操作前后插入内存屏障（StoreStore + StoreLoad），确保 `volatile` 变量的赋值不会被重排到构造方法调用之前。

具体的内存屏障插入策略（JSR-133）：

```
// instance = new DclSingleton() 翻译为：
分配内存
StoreStore 屏障      ← 确保初始化先于赋值
调用构造方法
StoreLoad 屏障       ← 确保赋值后对其他线程可见
instance = memory
```

因此，`volatile` 保证了"对象完全初始化完成后，引用才被赋值到 instance 变量"，其他线程看到的始终是完全初始化的对象。

## 实现方式对比

| 实现方式     | 线程安全 | 延迟加载 | 防止反射 | 防止序列化 |
|-------------|---------|---------|---------|-----------|
| 饿汉式       | 是      | 否      | 否      | 否        |
| 懒汉式+synchronized | 是 | 是    | 否      | 否        |
| DCL+volatile | 是     | 是      | 否      | 否        |
| 静态内部类    | 是      | 是      | 否      | 否        |
| 枚举         | 是      | 否(类似饿汉) | 是  | 是        |

## 面试官追问

**1. 如何破坏单例？如何防御？**

**破坏方式**：
- **反射**：通过 `Constructor.setAccessible(true)` 调用私有构造器创建新实例。枚举天然免疫反射攻击，因为 JVM 禁止反射创建枚举实例，会抛出 `IllegalArgumentException`。
- **序列化/反序列化**：即使实现了 `Serializable`，反序列化也会创建新对象。防御方式是在单例类中添加 `readResolve()` 方法，返回当前 instance。枚举同样天然免疫反序列化破坏。

```java
// 防御序列化破坏，在单例类中添加
private Object readResolve() {
    return instance;
}
```

**2. volatile 与 synchronized 的区别？**

`synchronized` 保证原子性+可见性+有序性（重量级），`volatile` 只保证可见性+有序性（轻量级），不保证原子性。DCL 中使用 `synchronized` 保护创建过程的原子性，`volatile` 确保对象创建完成后的可见性，二者配合使用。
