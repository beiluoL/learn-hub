---
title: NIO 新特性
category: java
module: java-io
subcat: roadmap
timeline: false
level: hard
tier: key
readMinutes: 12
tags: 异常与 IO
summary: Channel/Buffer 与 Files 新 API。
order: 5
---

- NIO：Channel + Buffer，面向块、非阻塞。
- `Files.readAllBytes / newBufferedReader` 简洁高效。
- 内存映射文件：`FileChannel.map`。
- `WatchService` 监听目录变化。
- 大文件处理优先用 NIO。

**自查清单**
- [ ] 理解 Channel/Buffer
- [ ] 会用 Files 新 API
- [ ] 了解内存映射
