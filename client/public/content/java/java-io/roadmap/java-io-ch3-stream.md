---
title: 字节流与字符流
category: java
module: java-io
subcat: roadmap
timeline: false
level: medium
tier: key
readMinutes: 12
tags: 异常与 IO
summary: InputStream/Reader 体系与缓冲流。
order: 4
---

- 字节流：`InputStream/OutputStream`（图片/二进制）。
- 字符流：`Reader/Writer`（文本，处理编码）。
- 缓冲流 `BufferedInputStream/BufferedReader` 提升性能。
- 装饰器模式：流可层层包装。
- 务必在 finally 或 try-with-resources 中关闭。

```java
try (BufferedReader br = new BufferedReader(new FileReader("a.txt"))) {
  String line; while ((line = br.readLine()) != null) System.out.println(line);
}
```

**自查清单**
- [ ] 区分字节/字符流
- [ ] 会用缓冲流
- [ ] 用 try-with-resources
