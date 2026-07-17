---
title: 生产者-消费者模型
category: interview
module: iv-java
subcat: cases
timeline: false
level: hard
tier: key
readMinutes: 16
tags: "Java 面试, 项目案例"
summary: 用 BlockingQueue 实现线程安全的生产消费解耦
order: 2
---

- 阻塞队列自动处理满/空等待
- put 阻塞、take 阻塞
- 可替代手写 wait/notify

```java
BlockingQueue<Integer> q = new ArrayBlockingQueue<>(10);
// 生产者
q.put(1);
// 消费者
Integer v = q.take();
```

**自查清单**
- [ ] 能说明阻塞语义
- [ ] 能写出完整 Demo
