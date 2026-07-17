---
title: 词频统计
category: java
module: java-collection
subcat: cases
timeline: false
level: easy
tier: core
readMinutes: 20
tags: "集合框架, 项目案例"
summary: 用 Map 统计一段文本中各单词出现次数并排序输出。
order: 1
---

- 按空格/标点切分文本为单词。
- `Map<String, Integer>` 计数。
- 按次数降序排序输出 Top N。
- （进阶）忽略大小写、过滤停用词。

```java
Map<String, Integer> freq = new HashMap<>();
for (String w : words) freq.merge(w, 1, Integer::sum);
```

**自查清单**
- [ ] 用 Map 计数
- [ ] 会排序输出
- [ ] 代码正确
