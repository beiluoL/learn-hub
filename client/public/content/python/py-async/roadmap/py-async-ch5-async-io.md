---
title: 异步 I/O 实战
category: python
module: py-async
subcat: roadmap
timeline: false
level: hard
tier: key
readMinutes: 15
tags: 异步与并发 (asyncio/多线程/多进程)
summary: aiohttp/aiomysql
order: 6
---

- 异步客户端提吞吐
- 连接池复用
- 避免阻塞事件循环
- run_in_executor 跑同步

```python
import asyncio, aiohttp

async def get(url):
    async with aiohttp.ClientSession() as s:
        async with s.get(url) as r:
            return r.status

print(asyncio.run(get("https://example.com")))
```

**自查清单**
- [ ] 异步请求
- [ ] 理解非阻塞
