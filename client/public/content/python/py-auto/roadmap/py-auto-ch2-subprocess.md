---
title: 调用外部命令
category: python
module: py-auto
subcat: roadmap
timeline: false
level: medium
tier: core
readMinutes: 12
tags: 自动化运维 (脚本/文件批处理/定时任务)
summary: subprocess 运行 shell
order: 3
---

- subprocess.run 执行命令
- 捕获 stdout/stderr
- check=True 抛异常
- 避免 shell 注入

```python
import subprocess

r = subprocess.run(
    ["ls", "-l"],
    capture_output=True,
    text=True,
    check=True,
)
print(r.stdout)
```

> 尽量传列表参数而非 shell=True，防止注入。

**自查清单**
- [ ] 运行命令并捕获输出
- [ ] 用 check 处理错误
