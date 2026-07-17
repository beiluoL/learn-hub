---
title: 反爬与应对
category: python
module: py-crawler
subcat: roadmap
timeline: false
level: hard
tier: key
readMinutes: 15
tags: 爬虫 (requests/bs4/selenium/反爬)
summary: UA、代理与验证码
order: 5
---

- 随机 UA 与请求间隔
- 代理 IP 池轮换
- Cookie 维持会话
- 识别验证码与风控

```python
import random, requests

uas = ["Mozilla/5.0", "Chrome/120", "Safari/16"]
proxies = {"http": "http://10.0.0.1:8080"}
r = requests.get(
    "https://example.com",
    headers={"User-Agent": random.choice(uas)},
    proxies=proxies,
)
print(r.status_code)
```

**自查清单**
- [ ] 配置随机 UA
- [ ] 使用代理轮换
