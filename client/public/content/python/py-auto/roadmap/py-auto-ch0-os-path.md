---
title: 路径与文件操作
category: python
module: py-auto
subcat: roadmap
timeline: false
level: easy
tier: basic
readMinutes: 10
tags: 自动化运维 (脚本/文件批处理/定时任务)
summary: os/pathlib 管理文件
order: 1
---

- pathlib 面向对象路径
- glob 批量匹配文件
- mkdir/rmdir 目录
- exists/is_file 判断

```python
from pathlib import Path

for f in Path(".").glob("*.txt"):
    print(f.name, f.stat().st_size)
```

**自查清单**
- [ ] 遍历匹配文件
- [ ] 判断文件存在
