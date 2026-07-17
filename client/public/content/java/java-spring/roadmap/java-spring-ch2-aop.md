---
title: AOP 面向切面
category: java
module: java-spring
subcat: roadmap
timeline: false
level: hard
tier: key
readMinutes: 12
tags: Spring / Boot
summary: 切面、通知与事务注解原理。
order: 3
---

- AOP：把横切关注点（日志/事务/权限）抽离。
- 切点（Pointcut）+ 通知（Advice：前/后/环绕）。
- 底层：JDK 动态代理（接口）或 CGLIB（类）。
- `@Transactional` 即基于 AOP 的事务增强。
- 自调用（同类方法）AOP 不生效。

```java
@Around("execution(* com.x..service.*.*(..))")
public Object log(ProceedingJoinPoint pjp) throws Throwable {
  long s = System.nanoTime(); Object r = pjp.proceed(); return r;
}
```

**自查清单**
- [ ] 理解 AOP 概念
- [ ] 能写切面
- [ ] 理解事务注解原理
