---
title: 爬虫 (requests/bs4/selenium/反爬) · 系统学习路线
category: python
module: py-crawler
subcat: roadmap
timeline: true
level: medium
tier: core
readMinutes: 12
tags: "爬虫 (requests/bs4/selenium/反爬), 学习路线, 路线图"
summary: 从总览到逐章拆解的 爬虫 (requests/bs4/selenium/反爬) 学习路线，点开任意章节开始学习。
order: 0
---

这份路线把「爬虫 (requests/bs4/selenium/反爬)」拆成 7 个阶段，每个阶段给出**核心任务**与**练手目标**。建议边看边敲，每完成一项就勾掉一项。

## 0. requests 发起请求

GET/POST 抓取网页

- [ ] 发起 GET 请求
- [ ] 设置请求头

## 1. BeautifulSoup 解析

从 HTML 抽取数据

- [ ] 用 find_all 提取
- [ ] 使用 CSS 选择器

## 2. XPath 与 lxml

更强大的节点定位

- [ ] 写 XPath 表达式
- [ ] 按属性过滤

## 3. Selenium 自动化

抓取动态渲染页面

- [ ] 启动浏览器
- [ ] 等待并提取元素

## 4. 反爬与应对

UA、代理与验证码

- [ ] 配置随机 UA
- [ ] 使用代理轮换

## 5. 异步爬虫

aiohttp 提升并发

- [ ] 用 aiohttp 并发
- [ ] 用信号量限流

## 6. 数据持久化

存库或文件

- [ ] 结果落盘
- [ ] 支持断点续爬

## 资源与节奏

- 官方文档与权威资料优先；
- 节奏：每天 1~2 小时，理论 + 敲代码交替；
- 关键：每个模块至少完成 1 个可运行的小项目，代码放仓库。
