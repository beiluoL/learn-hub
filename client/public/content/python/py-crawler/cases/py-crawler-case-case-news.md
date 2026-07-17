---
title: 新闻标题采集
category: python
module: py-crawler
subcat: cases
timeline: false
level: medium
tier: core
readMinutes: 22
tags: "爬虫 (requests/bs4/selenium/反爬), 项目案例"
summary: 抓取并清洗新闻列表
order: 1
---

- 请求新闻列表页
- BS4 提取标题链接
- 去重入库
- 定时增量更新

```python
import requests
from bs4 import BeautifulSoup

r = requests.get("https://news.example.com")
soup = BeautifulSoup(r.text, "html.parser")
news = [a.get_text(strip=True) for a in soup.select(".title a")]
print(news[:10])
```

**自查清单**
- [ ] 提取标题
- [ ] 去重保存
