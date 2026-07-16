---
title: 类加载机制：双亲委派模型与自定义类加载器
category: java
level: advanced
readMinutes: 18
tags: "类加载, 双亲委派, 破坏, Tomcat"
summary: 讲清类加载全过程、双亲委派及其破坏场景（Tomcat）。
order: 45
prereq: java/java-jvm
---

## 一、类加载的全过程

Java 类的生命周期包含加载、连接、初始化、使用、卸载，其中“加载到初始化”由类加载器完成，分三个阶段：

1.  **加载（Loading）**：通过类的全限定名找到 `.class` 字节流，把静态存储结构转为方法区的运行时数据结构，并在堆中生成 `java.lang.Class` 对象作为访问入口。
2.  **连接（Linking）**：
    -   **验证**：校验字节码合法性（魔数、语义、符号引用），防止恶意或损坏的 class。
    -   **准备**：为类变量（static）分配内存并设零值（`static int x=5` 此时 x=0，5 在初始化阶段才赋）。
    -   **解析**：把常量池里的符号引用替换为直接引用（可延迟到初始化后）。
3.  **初始化（Initialization）**：执行类构造器 `<clinit>()`，即静态变量赋值和静态代码块，按代码顺序进行。 JVM 保证初始化加锁同步，多线程同时初始化只会执行一次。

## 二、三类内置类加载器

-   **Bootstrap ClassLoader（启动类加载器）**：最顶层，由 C++ 实现，加载 `JAVA_HOME/lib` 下的核心类（rt.jar、modules）。它自身不是 Java 对象，`getParent()` 返回 null。
-   **Extension ClassLoader（扩展类加载器）**：加载 `JAVA_HOME/lib/ext` 或 `java.ext.dirs` 指定目录的扩展类。
-   **Application ClassLoader（应用类加载器）**：加载 classpath 下的应用类，也称系统类加载器，是程序中默认使用的加载器。

## 三、双亲委派模型

**机制**：当一个类加载器收到加载请求，它先委托父加载器去加载；父加载器逐层向上，直到 Bootstrap。只有父加载器无法加载（搜索范围找不到）时，子加载器才尝试自己加载。代码核心是 `ClassLoader.loadClass` 中的 `parent.loadClass`。

**好处**：

-   **防止重复加载**：父类加载过的类，子类不会重复加载，全 JVM 只有一份 `java.lang.Object`。
-   **安全**：用户自定义 `java.lang.Hack` 永远无法被加载，因为 Bootstrap 已加载 `java.lang` 包下的核心类，且核心包受沙箱保护，阻止篡改系统类。

```java
// 标准双亲委派片段（简化自 ClassLoader.loadClass）
protected Class<?> loadClass(String name, boolean resolve)
        throws ClassNotFoundException {
    synchronized (getClassLoadingLock(name)) {
        Class<?> c = findLoadedClass(name);   // 1) 已加载过直接返回
        if (c == null) {
            try {
                if (parent != null)
                    c = parent.loadClass(name, false); // 2) 委托父加载器
                else
                    c = findBootstrapClassOrNull(name); // 3) 父为空交给 Bootstrap
            } catch (ClassNotFoundException e) { /* 父加载失败 */ }
            if (c == null)
                c = findClass(name);          // 4) 父都失败，自己加载
        }
        if (resolve) resolveClass(c);
        return c;
    }
}
```

## 四、如何破坏双亲委派

某些场景必须“先加载自己的类”，于是破坏（或说绕过）双亲委派：

-   **JDBC 与线程上下文类加载器（TICL）**：JDBC 的 `DriverManager` 在核心库（Bootstrap 加载），但各数据库驱动在应用层（App 加载）。核心库要去加载应用类，按双亲委派向上找不到。解决方案是把应用类加载器设为**线程上下文类加载器**，让核心代码通过 `Thread.currentThread().getContextClassLoader()` 反向加载驱动，这打破了严格的向上委派。
-   **Tomcat 的 WebAppClassLoader**：一个 Tomcat 跑多个 Web 应用，要求各应用类隔离（自己的类库不互相干扰，且可热部署无需重启）。WebAppClassLoader 先尝试自己加载（查 `/WEB-INF/classes` 和 `/WEB-INF/lib`），加载不到再委托父加载器，从而实现**应用间隔离**，这是典型的“反双亲委派”。
-   **OSGi**：每个 bundle 有自己的类加载器，按约定在 bundle 间网状委托，实现模块化热插拔。

## 五、自定义 ClassLoader

自定义加载器通常只需继承 `ClassLoader` 并重写 `findClass`（而非 `loadClass`，以保留双亲委派骨架），在 `findClass` 里读取字节码调用 `defineClass`。

下面从文件加载一个编译好的 `.class`，演示自定义加载：

```java
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Paths;

public class FileClassLoader extends ClassLoader {

    private final String classDir; // class 文件所在根目录

    public FileClassLoader(String classDir, ClassLoader parent) {
        super(parent);
        this.classDir = classDir;
    }

    // 重写 findClass：父类加载不到时由这里完成实际加载
    @Override
    protected Class<?> findClass(String name) throws ClassNotFoundException {
        // name 形如 com.demo.Hello，转为路径 com/demo/Hello.class
        String path = classDir + "/" + name.replace('.', '/') + ".class";
        try {
            byte[] bytes = Files.readAllBytes(Paths.get(path));
            // defineClass 把字节数组转为 Class 对象
            return defineClass(name, bytes, 0, bytes.length);
        } catch (IOException e) {
            throw new ClassNotFoundException("找不到类文件: " + path, e);
        }
    }

    public static void main(String[] args) throws Exception {
        FileClassLoader loader = new FileClassLoader(
                "/tmp/classes", Thread.currentThread().getContextClassLoader());
        // 用自定义加载器加载并实例化
        Class<?> clazz = loader.loadClass("com.demo.Hello");
        Object obj = clazz.getDeclaredConstructor().newInstance();
        System.out.println(obj.getClass().getClassLoader()); // 输出 FileClassLoader
    }
}
```

**热部署原理**：重新编译 `.class` 后，用一个全新的自定义 ClassLoader 实例去加载，旧 ClassLoader 因无引用被 GC 回收，从而实现“不改 JVM 进程、替换类定义”。Tomcat 的热加载和 Spring DevTools 都基于此思路——每个新版本对应一个新类加载器实例。

## 实际开发中的应用

-   **插件化架构**：主程序通过自定义 ClassLoader 从 jar/网络动态加载插件类，隔离不同插件。
-   **代码加密**：`.class` 加密存储，自定义加载器读取后解密再 `defineClass`，防止反编译。
-   **Tomcat 多应用隔离**：理解 WebAppClassLoader 的委托顺序，排查“类找不到/类冲突”（如应用自带 log4j 与容器冲突）。

**常见坑**：

-   重写了 `loadClass` 却忘了保留双亲委派，导致 `java.lang.Object` 被重复加载报 `ClassCastException`。
-   不同类加载器加载的同名类不相等（`instanceof` 失败），排查框架类冲突时注意。
-   热部署后旧 ThreadLocal 未清理，造成类加载器无法被回收（内存泄漏）。
