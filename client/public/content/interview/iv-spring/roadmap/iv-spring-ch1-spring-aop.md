---
title: AOP 面向切面
category: interview
module: iv-spring
subcat: roadmap
timeline: false
level: hard
tier: key
readMinutes: 13
tags: "Spring 面试, Spring, AOP"
summary: 代理、切点表达式与通知
order: 2
---

- JDK 动态代理(接口) vs CGLIB(类)
- 通知：Before/After/AfterReturning/Around/AfterThrowing
- 切点表达式 execution/annotation

```java
@Aspect
@Component
public class LogAspect {
    @Around("execution(* com.x..*(..))")
    public Object around(ProceedingJoinPoint p) throws Throwable {
        long s = System.nanoTime();
        Object r = p.proceed();
        System.out.println(System.nanoTime() - s);
        return r;
    }
}
```

> 同一类内方法互调不走代理，AOP 不生效。

**自查清单**
- [ ] 能说两种代理
- [ ] 能写切面
