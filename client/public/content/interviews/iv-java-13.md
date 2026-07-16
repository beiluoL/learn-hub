---
question: 类加载的双亲委派机制是什么？什么时候需要打破它？
category: java
difficulty: middle
tags: "类加载, 双亲委派, Tomcat, JDBC, SPI"
order: 27
---

## 核心结论

**回答**：双亲委派机制要求类加载器收到加载请求后，先委托父加载器尝试加载，只有父加载器无法加载时才自己加载。这种"向上委派、向下查找"的机制保障了 Java 核心类库的安全和类型唯一性。但 JDBC SPI、Tomcat 应用隔离等场景需要打破双亲委派——本质上是加载方向从"父→子"变成了"子→父"或"同级隔离"。

## 类加载的完整生命周期

```
加载 → 连接（验证 → 准备 → 解析）→ 初始化 → 使用 → 卸载
```

| 阶段 | 工作内容 |
|------|----------|
| 加载 | 通过类全限定名获取二进制字节流，转为方法区数据结构，生成 Class 对象 |
| 验证 | 文件格式验证、元数据验证、字节码验证、符号引用验证 |
| 准备 | 为 static 变量分配内存并赋零值（final static 直接赋值） |
| 解析 | 将符号引用替换为直接引用（类/字段/方法/接口方法） |
| 初始化 | 执行 `<clinit>()` 方法：static 变量赋值 + static 代码块 |

## 三层类加载器

```java
// Bootstrap ClassLoader（C++ 实现，Java 中为 null）
// 加载路径：<JAVA_HOME>/jre/lib/rt.jar 等核心类库
String.class.getClassLoader(); // null

// Extension ClassLoader（JDK 8）/ Platform ClassLoader（JDK 9+）
// 加载路径：<JAVA_HOME>/jre/lib/ext / 模块系统
ClassLoader extLoader = ClassLoader.getSystemClassLoader().getParent();

// Application ClassLoader（应用类加载器）
// 加载路径：classpath 下的类
ClassLoader appLoader = ClassLoader.getSystemClassLoader();
```

## 双亲委派源码解析

```java
// ClassLoader.loadClass 核心逻辑
protected Class<?> loadClass(String name, boolean resolve) throws ClassNotFoundException {
    synchronized (getClassLoadingLock(name)) {
        // 1. 检查是否已加载
        Class<?> c = findLoadedClass(name);
        if (c == null) {
            try {
                if (parent != null) {
                    // 2. 先委托父加载器
                    c = parent.loadClass(name, false);
                } else {
                    // 3. 父加载器为 null，使用 Bootstrap 尝试
                    c = findBootstrapClassOrNull(name);
                }
            } catch (ClassNotFoundException e) {
                // 父加载器找不到，继续
            }
            if (c == null) {
                // 4. 父加载器加载失败，自己尝试
                c = findClass(name);
            }
        }
        if (resolve) {
            resolveClass(c);
        }
        return c;
    }
}
```

### 双亲委派的两大好处

1. **安全性**：防止核心类库被篡改。例如自己写一个 `java.lang.String`，双亲委派会先让 Bootstrap 加载官方的 String 类。

2. **避免类的重复加载**：同一个类只会被最顶层的加载器加载一次，不同类加载器不会重复加载相同的类。

## 打破双亲委派的三大场景

### 场景一：JDBC SPI（线程上下文类加载器）

**问题**：JDBC 驱动接口在 `java.sql` 包中由 Bootstrap 加载，但具体驱动实现（如 MySQL Driver）在 classpath 中，Bootstrap 无法加载。双亲委派的"向上找"方向与"接口在高层、实现在低层"的需求相反。

**解决方案**：JDBC 通过 `Thread.currentThread().getContextClassLoader()` 打破双亲委派：

```java
// DriverManager 加载驱动的核心逻辑
ServiceLoader<Driver> loader = ServiceLoader.load(Driver.class);
// ServiceLoader 内部用线程上下文类加载器加载 META-INF/services/ 中的实现

// 实际原理：
ClassLoader cl = Thread.currentThread().getContextClassLoader();
// cl 是 AppClassLoader，可以加载 classpath 中的 MySQL Connector
```

### 场景二：Tomcat 的 WebAppClassLoader（应用隔离）

**问题**：同一个 Tomcat 实例部署多个 Web 应用，需要隔离各自使用的不同版本 jar（例如应用 A 用 Spring 4，应用 B 用 Spring 5）。

**解决方案**：Tomcat 自定义 WebAppClassLoader，**先自己加载，加载不到再向上委托**（破坏双亲委派）：

```java
// Tomcat WebAppClassLoader 加载逻辑（简化）
public Class<?> loadClass(String name) {
    // 1. 检查本地缓存
    Class<?> clazz = findLoadedClass0(name);
    if (clazz != null) return clazz;
    // 2. 检查系统类缓存
    clazz = findLoadedClass(name);
    if (clazz != null) return clazz;
    // 3. 尝试用 Bootstrap 加载（核心类库用父加载器）
    try {
        clazz = bootstrap.loadClass(name);
        if (clazz != null) return clazz;
    } catch (ClassNotFoundException ignored) {}
    // 4. 关键：先自己加载（打破双亲委派）
    try {
        clazz = findClass(name);  // 在 WEB-INF/classes 和 WEB-INF/lib 中寻找
        if (clazz != null) return clazz;
    } catch (ClassNotFoundException ignored) {}
    // 5. 自己找不到，再委托父加载器
    return parent.loadClass(name);
}
```

### 场景三：自定义类加载器

```java
public class FileSystemClassLoader extends ClassLoader {
    private String classpath;

    public FileSystemClassLoader(String classpath) {
        this.classpath = classpath;
    }

    @Override
    protected Class<?> findClass(String name) throws ClassNotFoundException {
        byte[] data = loadByteCode(name);
        // 将字节码转换为 Class 对象
        return defineClass(name, data, 0, data.length);
    }

    private byte[] loadByteCode(String name) {
        String path = classpath + File.separator +
            name.replace('.', File.separatorChar) + ".class";
        try (InputStream is = new FileInputStream(path);
             ByteArrayOutputStream bos = new ByteArrayOutputStream()) {
            byte[] buffer = new byte[1024];
            int len;
            while ((len = is.read(buffer)) != -1) {
                bos.write(buffer, 0, len);
            }
            return bos.toByteArray();
        } catch (IOException e) {
            throw new RuntimeException(e);
        }
    }
}

// 使用：打破双亲委派，直接加载
FileSystemClassLoader loader = new FileSystemClassLoader("/data/classes");
Class<?> clazz = loader.loadClass("com.example.MyClass");
```

## 类的唯一性判定

**同一个类 = 全限定名 + 同一个类加载器**。不同类加载器加载的同一个类，JVM 认为是不同的类。

```java
// 两个不同 ClassLoader 加载的同一个类不相等
ClassLoader loader1 = new FileSystemClassLoader("/path1");
ClassLoader loader2 = new FileSystemClassLoader("/path2");
Class<?> clazz1 = loader1.loadClass("User");
Class<?> clazz2 = loader2.loadClass("User");
System.out.println(clazz1 == clazz2);        // false
System.out.println(clazz1.equals(clazz2));   // false
```

## 面试追问

1. **OSGi 如何打破双亲委派？** OSGi 使用网状类加载模型，每个 Bundle 有自己的 ClassLoader，通过 Import/Export 声明依赖关系，Bundle 之间可以互相委托加载，形成扁平而非层级结构。

2. **Class.forName 和 ClassLoader.loadClass 的区别？** Class.forName 会执行类的初始化（static 代码块和 static 变量赋值），loadClass 默认不会（除非传入 resolve=true）。JDBC 用 Class.forName 加载驱动就是为了触发静态代码块中 Driver 注册逻辑。

3. **Java 9 模块化对类加载机制有什么影响？** Extension ClassLoader 变更为 Platform ClassLoader，增加了模块路径。加载顺序：Bootstrap → Platform → Application。模块的 `exports` / `requires` 进一步控制了类的可访问性，即使被同一个 ClassLoader 加载，未导出的包也无法通过反射访问。

4. **如何排查 ClassNotFoundException / NoClassDefFoundError？** ClassNotFoundException 是类加载时找不到，NoClassDefFoundError 是编译时存在运行时找不到（通常 jar 冲突）。排查：mvn dependency:tree、Arthas classloader 命令、-verbose:class 参数追踪类加载过程。
