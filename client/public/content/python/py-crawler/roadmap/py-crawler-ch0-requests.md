---
title: requests 发起请求
category: python
module: py-crawler
subcat: roadmap
timeline: false
level: easy
tier: basic
readMinutes: 11
tags: 爬虫 (requests/bs4/selenium/反爬)
summary: GET/POST 抓取网页
order: 1
---

- requests.get 获取响应
- status_code 判断成功
- params 传查询参数
- headers 设置 UA

```python
import requests

r = requests.get(
    "https://httpbin.org/get",
    params={"q": "python"},
    headers={"User-Agent": "Mozilla/5.0"},
    timeout=10,
)
print(r.status_code, r.json())
```

**自查清单**
- [ ] 发起 GET 请求
- [ ] 设置请求头
