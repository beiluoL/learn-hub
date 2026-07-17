---
title: 定时任务
category: python
module: py-auto
subcat: roadmap
timeline: false
level: medium
tier: key
readMinutes: 13
tags: 自动化运维 (脚本/文件批处理/定时任务)
summary: 调度脚本周期运行
order: 5
---

- schedule 库简单定时
- APScheduler 高级调度
- crontab 系统级
- 守护进程常驻

```python
import schedule, time

def job():
    print("每日备份")

schedule.every().day.at("02:00").do(job)
while True:
    schedule.run_pending()
    time.sleep(60)
```

**自查清单**
- [ ] 设置每日任务
- [ ] 循环触发调度
