---
title: 批量文件处理
category: python
module: py-auto
subcat: roadmap
timeline: false
level: easy
tier: core
readMinutes: 11
tags: 自动化运维 (脚本/文件批处理/定时任务)
summary: 复制移动与重命名
order: 2
---

- shutil.copy / move
- 批量重命名
- 压缩解压 zipfile
- 目录树遍历

```python
import shutil
from pathlib import Path

for i, f in enumerate(Path("in").glob("*.jpg")):
    shutil.move(str(f), f"out/img_{i}.jpg")
```

**自查清单**
- [ ] 批量重命名
- [ ] 复制移动文件
