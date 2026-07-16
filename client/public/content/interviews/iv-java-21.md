---
question: Spring Bean 的完整生命周期是怎样的？
category: java
difficulty: hard
tags: "Spring, Bean生命周期, 后置处理器, 初始化"
order: 61
---

**核心结论**：Spring Bean 的生命周期涵盖了从实例化到销毁的全过程，总共经历约 10+ 个关键步骤。理解 Bean 的生命周期是深入 Spring 源码的基础，尤其是**三级缓存与循环依赖**的关系、**BeanPostProcessor 的应用时机**是面试中的高频追问点。核心流程为**：**实例化 → 属性填充 → Aware 接口回调 → BeanPostProcessor 前置处理 → @PostConstruct 初始化 → InitializingBean → BeanPostProcessor 后置处理 → 使用 → @PreDestroy 销毁 → DisposableBean → 销毁完成**。

## Bean 生命周期完整流程

```
1. 实例化（Instantiation）
   调用构造方法或工厂方法创建 Bean 实例
        ↓
2. 属性填充（Populate Properties）
   依赖注入：@Autowired、@Value 等注解注入
        ↓
3. Aware 接口回调（按顺序）
   3.1 BeanNameAware.setBeanName()
   3.2 BeanClassLoaderAware.setBeanClassLoader()
   3.3 BeanFactoryAware.setBeanFactory()
   3.4 ApplicationContextAware.setApplicationContext()（需要 ApplicationContext）
        ↓
4. BeanPostProcessor.postProcessBeforeInitialization()
   所有 BeanPostProcessor 的 before 方法依次执行
   包括 CommonAnnotationBeanPostProcessor 处理 @PostConstruct
        ↓
5. InitializingBean.afterPropertiesSet()
   如果 Bean 实现了 InitializingBean 接口
        ↓
6. 自定义 init-method
   XML 配置的 init-method 或 @Bean(initMethod = "init")
        ↓
7. BeanPostProcessor.postProcessAfterInitialization()
   所有 BeanPostProcessor 的 after 方法依次执行
   AOP 代理对象在此阶段生成！
        ↓
8. Bean 就绪（Ready for Use）
   放入 singletonObjects 一级缓存，可供其他 Bean 使用
        ↓
9. 容器关闭时
   9.1 @PreDestroy 注解的方法
   9.2 DisposableBean.destroy()
   9.3 自定义 destroy-method
        ↓
10. 销毁完成
```

## 代码验证示例

```java
@Component
public class LifecycleBean implements BeanNameAware,
        BeanFactoryAware, ApplicationContextAware,
        InitializingBean, DisposableBean {

    private String prop;

    public LifecycleBean() {
        System.out.println("1. 实例化：构造方法");
    }

    @Autowired
    public void setProp(String prop) {
        System.out.println("2. 属性注入：setProp");
        this.prop = prop;
    }

    @Override
    public void setBeanName(String name) {
        System.out.println("3.1 BeanNameAware: " + name);
    }

    @Override
    public void setBeanClassLoader(ClassLoader classLoader) {
        System.out.println("3.2 BeanClassLoaderAware");
    }

    @Override
    public void setBeanFactory(BeanFactory beanFactory) {
        System.out.println("3.3 BeanFactoryAware");
    }

    @Override
    public void setApplicationContext(ApplicationContext ctx) {
        System.out.println("3.4 ApplicationContextAware");
    }

    @PostConstruct
    public void postConstruct() {
        System.out.println("4. @PostConstruct 初始化");
    }

    @Override
    public void afterPropertiesSet() {
        System.out.println("5. InitializingBean.afterPropertiesSet()");
    }

    @Bean(initMethod = "customInit")
    public void customInit() {
        System.out.println("6. 自定义 init-method");
    }

    @PreDestroy
    public void preDestroy() {
        System.out.println("9.1 @PreDestroy 销毁");
    }

    @Override
    public void destroy() {
        System.out.println("9.2 DisposableBean.destroy()");
    }
}
```

自定义 `BeanPostProcessor`：

```java
@Component
public class CustomBeanPostProcessor implements BeanPostProcessor {

    @Override
    public Object postProcessBeforeInitialization(Object bean, String beanName) {
        if ("lifecycleBean".equals(beanName)) {
            System.out.println("4. BeanPostProcessor Before: " + beanName);
        }
        return bean;
    }

    @Override
    public Object postProcessAfterInitialization(Object bean, String beanName) {
        if ("lifecycleBean".equals(beanName)) {
            System.out.println("7. BeanPostProcessor After: " + beanName);
        }
        return bean; // AOP 在此返回代理对象
    }
}
```

**实际执行输出顺序**：
```
1. 实例化：构造方法
2. 属性注入：setProp
3.1 BeanNameAware: lifecycleBean
3.2 BeanClassLoaderAware
3.3 BeanFactoryAware
3.4 ApplicationContextAware
4. BeanPostProcessor Before: lifecycleBean
4. @PostConstruct 初始化
5. InitializingBean.afterPropertiesSet()
6. 自定义 init-method
7. BeanPostProcessor After: lifecycleBean
8. Bean 就绪，开始使用

...容器关闭...
9.1 @PreDestroy 销毁
9.2 DisposableBean.destroy()
```

## 三级缓存与循环依赖

Spring 通过三级缓存解决单例 Bean 的循环依赖问题，关键时机在生命周期中：

| 缓存级别 | 名称                    | 存储内容                        | 用途                           |
|---------|------------------------|--------------------------------|-------------------------------|
| 一级缓存 | `singletonObjects`      | 完全初始化的单例 Bean             | 对外提供，getBean 首先查这里      |
| 二级缓存 | `earlySingletonObjects` | 早期暴露的半成品 Bean（属性已填充）  | 供其他 Bean 依赖注入使用         |
| 三级缓存 | `singletonFactories`    | Bean 工厂对象（ObjectFactory）    | 生成代理对象（AOP 代理）         |

**循环依赖解决过程（以 A 和 B 互相依赖为例）**：

```
1. 创建 A：实例化后，三级缓存放入 A 的 ObjectFactory
2. A 属性填充：发现需要注入 B
3. 获取 B：B 不存在 → 创建 B
4. 创建 B：实例化后，三级缓存放入 B 的 ObjectFactory
5. B 属性填充：发现需要注入 A
6. 获取 A：从三级缓存获取 A 的 ObjectFactory → 生成早期引用 → 放入二级缓存
7. B 属性填充完成 → B 初始化完成 → 放入一级缓存
8. A 属性填充完成（拿到 B）→ A 初始化完成 → 放入一级缓存
```

**使用三级缓存而不是两级的原因**：三级缓存中存放的是 `ObjectFactory`（而非直接存放早期 Bean 引用），目的是在需要 AOP 代理时能动态生成代理对象。如果只有二级缓存直接存放原始对象，就无法支持涉及 AOP 的循环依赖。

## 面试官追问

**1. @PostConstruct、afterPropertiesSet 和 init-method 的执行顺序？**

顺序是**：**@PostConstruct → InitializingBean.afterPropertiesSet() → init-method**。但 `@PostConstruct` 处理的实际执行位置是在 `BeanPostProcessor.postProcessBeforeInitialization()` 中（由 `CommonAnnotationBeanPostProcessor` 处理，该类优先级较高），而 `afterPropertiesSet` 和 `init-method` 则在 Spring 内部调用的 `invokeInitMethods()` 方法中执行。

**2. 为什么构造器注入不能解决循环依赖？**

构造器注入发生在实例化阶段，此时 Bean 实例尚未创建完成，无法放入三级缓存暴露早期引用。Spring 能解决循环依赖的前提是：Bean 至少完成了实例化（即构造方法已执行，对象已分配内存），可以将早期引用缓存起来供其他 Bean 使用。构造器注入的循环依赖在实例化阶段就卡住了（A 需要 B，B 需要 A，两者都无法实例化完成），Spring 会抛出 `BeanCurrentlyInCreationException`。Solution：改用 `@Autowired` 字段注入或 `@Lazy` 延迟初始化。
