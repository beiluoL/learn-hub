---
title: 日志与告警
category: python
module: py-auto
subcat: roadmap
timeline: false
level: medium
tier: core
readMinutes: 12
tags: 自动化运维 (脚本/文件批处理/定时任务)
summary: 结构化记录运行
order: 4
---

- logging 分级记录
- 配置 handler 与格式
- 文件滚动 RotatingFileHandler
- 异常捕获与告警

```python
import logging

logging.basicConfig(
    filename="app.log",
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(message)s",
)
logging.info("任务开始")
logging.error("出错了")
```

**自查清单**
- [ ] 配置日志文件
- [ ] 分级记录
