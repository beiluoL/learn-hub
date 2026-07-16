---
question: Spring IoC 如何解决循环依赖？三级缓存分别存什么？
category: java
difficulty: hard
tags: "Spring, IoC, 循环依赖, 三级缓存"
order: 20
---

## 核心结论

**回答**：Spring 通过三级缓存（singletonObjects、earlySingletonObjects、singletonFactories）解决单例 Setter 注入的循环依赖，核心原理是"提前暴露半成品对象引用"。三级而非两级是为了处理 AOP 代理场景——singletonFactories 中的 ObjectFactory 可以在需要时调用 getEarlyBeanReference 创建代理对象。原型 bean 和构造器注入的循环依赖无法解决。

## 三级缓存

### 数据结构

```java
// DefaultSingletonBeanRegistry 源码
public class DefaultSingletonBeanRegistry extends SimpleAliasRegistry {
    // 一级缓存：完全初始化好的单例 bean
    private final Map<String, Object> singletonObjects = new ConcurrentHashMap<>(256);

    // 二级缓存：提前暴露的原始对象（未完成属性填充）
    private final Map<String, Object> earlySingletonObjects = new HashMap<>(16);

    // 三级缓存：对象工厂，生产提前暴露的 bean 引用
    private final Map<String, ObjectFactory<?>> singletonFactories = new HashMap<>(16);

    // 正在创建的 bean 名称集合
    private final Set<String> singletonsCurrentlyInCreation =
        Collections.newSetFromMap(new ConcurrentHashMap<>(16));
}
```

### 三级缓存存储内容对比

| 缓存级别 | 名称 | Key | Value | 说明 |
|----------|------|-----|-------|------|
| 一级缓存 | singletonObjects | beanName | 完全就绪的 bean 实例 | 所有属性填充完毕、完成初始化 |
| 二级缓存 | earlySingletonObjects | beanName | 提前暴露的 bean 引用 | 已从三级缓存升级上来，可能是原始对象或代理 |
| 三级缓存 | singletonFactories | beanName | ObjectFactory | 一个 lambda，调用 getObject() 可获取 bean 早期引用 |

## 解决循环依赖的完整流程

以 A 依赖 B、B 依赖 A 的经典场景为例：

```java
@Service
public class A {
    @Autowired
    private B b;
}

@Service
public class B {
    @Autowired
    private A a;
}
```

### 流程图解

```
1. 创建 A：调用构造器 → 实例化 A（原始对象）
2. 将 A 的 ObjectFactory 放入三级缓存
3. 填充 A 的属性 b → 发现依赖 B → 去创建 B
4. 创建 B：调用构造器 → 实例化 B（原始对象）
5. 将 B 的 ObjectFactory 放入三级缓存
6. 填充 B 的属性 a → 发现依赖 A
7. 从三级缓存获取 A 的 ObjectFactory → 调用 getObject()
   → 如果 A 需要 AOP，调用 getEarlyBeanReference 创建代理
   → 将结果放入二级缓存、删除三级缓存中 A 的 factory
8. B 获得 A 的引用 → 完成 B 的属性填充和初始化
9. 将完全就绪的 B 放入一级缓存
10. A 获得 B 的引用 → 完成 A 的属性填充和初始化
11. 将完全就绪的 A 放入一级缓存 → 删除二级/三级缓存中的 A
```

### 核心源码（简化）

```java
// AbstractAutowireCapableBeanFactory
protected Object doCreateBean(String beanName, RootBeanDefinition mbd, Object[] args) {
    BeanWrapper instanceWrapper = createBeanInstance(beanName, mbd, args);
    Object bean = instanceWrapper.getWrappedInstance();

    // 关键：如果允许循环引用(默认 true)且 bean 正在创建中，放入三级缓存
    boolean earlySingletonExposure = (mbd.isSingleton() && this.allowCircularReferences
            && isSingletonCurrentlyInCreation(beanName));
    if (earlySingletonExposure) {
        addSingletonFactory(beanName, () -> getEarlyBeanReference(beanName, mbd, bean));
    }

    // 填充属性 → 可能触发另一个 bean 的创建（循环依赖的入口）
    populateBean(beanName, mbd, instanceWrapper);

    // 初始化回调（@PostConstruct、InitializingBean 等）
    exposedObject = initializeBean(beanName, exposedObject, mbd);

    return exposedObject;
}
```

## 为什么需要三级缓存，两级不够吗

这是高频追问。如果只有两级（singletonObjects + earlySingletonObjects），问题在于 **AOP 代理**。

**核心难题**：当一个 bean 需要 AOP 代理时，最终放在一级缓存中的应该是代理对象而非原始对象。但生成代理的时机（`BeanPostProcessor` 的 `postProcessAfterInitialization`）在属性填充之后。如果没有三级缓存的 ObjectFactory，我们直到初始化结束才能拿到代理，而此时依赖它的 bean 可能已经持有了原始对象的引用导致类型不匹配。

三级缓存的 ObjectFactory 提供了 **懒加载** 能力：调用 `getEarlyBeanReference` 可以提前生成代理对象，放入二级缓存，后续所有依赖方获取到的都是同一个代理对象。

```java
// getEarlyBeanReference 关键实现
protected Object getEarlyBeanReference(String beanName, RootBeanDefinition mbd, Object bean) {
    Object exposedObject = bean;
    for (SmartInstantiationAwareBeanPostProcessor bp : getBeanPostProcessors()) {
        // AbstractAutoProxyCreator 会在此处创建代理
        exposedObject = bp.getEarlyBeanReference(exposedObject, beanName);
    }
    return exposedObject;
}
```

## 哪些循环依赖无法解决

### 1. 原型（prototype）bean 的循环依赖

```java
@Scope("prototype")
@Component
public class ProtoA {
    @Autowired
    private ProtoB protoB; // 直接抛 BeanCurrentlyInCreationException
}
```
原型 bean 不会被放入缓存，每次都是新建，无法提前暴露，Spring 直接抛异常。

### 2. 构造器注入的循环依赖

```java
@Component
public class CtorA {
    private CtorB b;
    public CtorA(CtorB b) { // 构造器依赖，A 刚创建就需要 B
        this.b = b;
    }
}

@Component
public class CtorB {
    private CtorA a;
    public CtorB(CtorA a) { // 构造器依赖，B 刚创建就需要 A
        this.a = a;
    }
}
```
构造器注入时，A 创建完成后还没来得及放入缓存就需要 B，B 创建时去缓存找 A 却发现还没有，死循环。

**解决方案**：
- 将其中一方的构造器注入改为 Setter/Field 注入
- 使用 `@Lazy` 延迟注入

```java
@Component
public class CtorA {
    private CtorB b;
    public CtorA(@Lazy CtorB b) { // Lazy 代理，延迟获取真实 Bean
        this.b = b;
    }
}
```

## 面试追问

1. **Spring 为什么要开放 allowCircularReferences？默认为什么是 true？** 实际项目多少会有双向依赖，不禁能减少迁移成本。但可以设为 false 以便尽早发现设计问题。Spring Boot 2.6+ 默认不允许循环依赖，会报错提示改为 Setter 注入或使用 @Lazy。

2. **循环依赖能真正从设计上解决吗？** 最佳实践是引入中间层 C，A 和 B 都依赖 C；或者使用事件驱动解耦。

3. **如果 A 和 B 都需要 AOP，流程有何不同？** 各自在 getEarlyBeanReference 阶段生成各自的代理对象存入二级缓存。后续注入时双方拿到的都是代理，最终一级缓存中也是代理。

4. **二级缓存升级到一级缓存时有什么特殊处理？** doGetBean 中会判断 exposedObject == bean（getSingleton 返回的早期引用与最终 bean 是否一致），不一致则说明中间可能有 BeanPostProcessor 又生成了新代理，需要更新缓存。
