---
title: 并发网页抓取
category: python
module: py-async
subcat: cases
timeline: false
level: hard
tier: core
readMinutes: 26
tags: "异步与并发 (asyncio/多线程/多进程), 项目案例"
summary: asyncio 抓取多页
order: 1
---

- 并发请求多个 URL
- 限制并发信号量
- 收集状态码
- 异常处理失败任务

```python
import asyncio, aiohttp

async def fetch(s, url):
    async with s.get(url) as r:
        return r.status

async def main(urls):
    async with aiohttp.ClientSession() as s:
        return await asyncio.gather(*(fetch(s, u) for u in urls))

print(asyncio.run(main(["https://example.com"] * 3)))
```

**自查清单**
- [ ] 并发抓取
- [ ] 限制并发数
