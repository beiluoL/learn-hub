---
title: DNS 与网络分层
category: interview
module: iv-osnet
subcat: roadmap
timeline: false
level: easy
tier: basic
readMinutes: 8
tags: "操作系统与网络, 网络, DNS"
summary: "域名解析与 OSI/TCP-IP 模型"
order: 6
---

- DNS 递归+迭代查询，逐级解析
- TCP/IP 四层 vs OSI 七层
- ARP 解析 IP 到 MAC

```bash
dig example.com +trace
# 查看本地 DNS 缓存与解析路径
nslookup example.com
```

> DNS 劫持与缓存污染是常见安全问题。

**自查清单**
- [ ] 能说解析流程
- [ ] 能说分层
