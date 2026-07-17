---
title: BeautifulSoup 解析
category: python
module: py-crawler
subcat: roadmap
timeline: false
level: easy
tier: core
readMinutes: 12
tags: 爬虫 (requests/bs4/selenium/反爬)
summary: 从 HTML 抽取数据
order: 2
---

- BeautifulSoup 解析文档
- find / find_all 定位
- select 用 CSS 选择器
- get_text 取文本

```python
from bs4 import BeautifulSoup

html = "<ul><li>甲</li><li>乙</li></ul>"
soup = BeautifulSoup(html, "html.parser")
items = [li.get_text() for li in soup.find_all("li")]
print(items)
```

**自查清单**
- [ ] 用 find_all 提取
- [ ] 使用 CSS 选择器
