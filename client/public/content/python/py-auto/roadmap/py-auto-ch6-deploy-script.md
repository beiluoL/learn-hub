---
title: 部署与监控脚本
category: python
module: py-auto
subcat: roadmap
timeline: false
level: hard
tier: extra
readMinutes: 14
tags: 自动化运维 (脚本/文件批处理/定时任务)
summary: 健康检查与自愈
order: 7
---

- 探测服务端口健康
- 异常自动重启
- 钉钉/邮件告警
- 资源占用监控

```python
import socket, subprocess

def healthy(host, port):
    s = socket.socket()
    try:
        s.connect((host, port))
        return True
    except OSError:
        return False
    finally:
        s.close()

if not healthy("127.0.0.1", 8000):
    subprocess.run(["systemctl", "restart", "app"])
```

**自查清单**
- [ ] 端口健康检查
- [ ] 异常自动重启
