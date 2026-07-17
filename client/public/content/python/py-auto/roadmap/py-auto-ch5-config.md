---
title: 配置与环境变量
category: python
module: py-auto
subcat: roadmap
timeline: false
level: easy
tier: extra
readMinutes: 10
tags: 自动化运维 (脚本/文件批处理/定时任务)
summary: yaml/env 管理配置
order: 6
---

- python-dotenv 读取 .env
- yaml.safe_load 解析
- 区分开发生产配置
- 敏感信息不入仓库

```yaml
database:
  host: localhost
  port: 5432
debug: true
```

**自查清单**
- [ ] 读取 .env
- [ ] 解析 yaml 配置
