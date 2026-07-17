---
title: 数据持久化
category: python
module: py-crawler
subcat: roadmap
timeline: false
level: easy
tier: extra
readMinutes: 10
tags: 爬虫 (requests/bs4/selenium/反爬)
summary: 存库或文件
order: 7
---

- 存为 CSV/JSON
- 写入数据库
- 增量去重
- 断点续爬

```json
{
  "items": [
    {"title": "A", "url": "https://a"},
    {"title": "B", "url": "https://b"}
  ]
}
```

**自查清单**
- [ ] 结果落盘
- [ ] 支持断点续爬
