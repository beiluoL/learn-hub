---
title: Selenium 自动化
category: python
module: py-crawler
subcat: roadmap
timeline: false
level: medium
tier: key
readMinutes: 15
tags: 爬虫 (requests/bs4/selenium/反爬)
summary: 抓取动态渲染页面
order: 4
---

- WebDriver 启动浏览器
- find_element 定位元素
- 显式等待页面加载
- 执行点击与输入

```python
from selenium import webdriver
from selenium.webdriver.common.by import By

driver = webdriver.Chrome()
driver.get("https://example.com")
title = driver.find_element(By.TAG_NAME, "h1").text
print(title)
driver.quit()
```

> 动态站点优先尝试接口，Selenium 作为兜底。

**自查清单**
- [ ] 启动浏览器
- [ ] 等待并提取元素
