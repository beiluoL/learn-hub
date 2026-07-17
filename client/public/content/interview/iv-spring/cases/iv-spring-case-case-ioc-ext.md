---
title: 扩展 IoC 容器
category: interview
module: iv-spring
subcat: cases
timeline: false
level: hard
tier: key
readMinutes: 14
tags: "Spring 面试, 项目案例"
summary: 自定义 BeanPostProcessor 实现统一处理
order: 2
---

- 实现 BeanPostProcessor 拦截 bean
- 可用于日志/校验/注解增强
- 注意执行顺序与性能

```java
@Component
public class TraceProcessor implements BeanPostProcessor {
    public Object postProcessAfterInitialization(Object b, String n) {
        if (b instanceof Traceable) System.out.println("trace:" + n);
        return b;
    }
}
```

**自查清单**
- [ ] 能写后置处理器
- [ ] 能说应用场景
