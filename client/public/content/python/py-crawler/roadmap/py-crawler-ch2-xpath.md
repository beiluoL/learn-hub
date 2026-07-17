---
title: XPath 与 lxml
category: python
module: py-crawler
subcat: roadmap
timeline: false
level: medium
tier: core
readMinutes: 12
tags: 爬虫 (requests/bs4/selenium/反爬)
summary: 更强大的节点定位
order: 3
---

- lxml 高性能解析
- XPath 路径表达式
- 谓语过滤节点
- text() 取文本

```python
from lxml import etree

tree = etree.HTML("<div><p class='x'>hi</p></div>")
texts = tree.xpath("//p[@class='x']/text()")
print(texts)
```

**自查清单**
- [ ] 写 XPath 表达式
- [ ] 按属性过滤
