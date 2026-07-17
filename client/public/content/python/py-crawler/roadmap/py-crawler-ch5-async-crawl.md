---
title: 异步爬虫
category: python
module: py-crawler
subcat: roadmap
timeline: false
level: hard
tier: extra
readMinutes: 16
tags: 爬虫 (requests/bs4/selenium/反爬)
summary: aiohttp 提升并发
order: 6
---

- aiohttp 异步请求
- asyncio.gather 并发
- 限制并发信号量
- 速率控制防封

```python
import asyncio, aiohttp

async def fetch(session, url):
    async with session.get(url) as r:
        return await r.text()

async def main():
    async with aiohttp.ClientSession() as s:
        pages = await asyncio.gather(
            fetch(s, "https://example.com"),
            fetch(s, "https://example.org"),
        )
        print(len(pages))

asyncio.run(main())
```

**自查清单**
- [ ] 用 aiohttp 并发
- [ ] 用信号量限流
