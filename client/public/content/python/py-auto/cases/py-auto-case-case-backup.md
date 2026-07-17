---
title: 日志自动备份
category: python
module: py-auto
subcat: cases
timeline: false
level: medium
tier: core
readMinutes: 20
tags: "自动化运维 (脚本/文件批处理/定时任务), 项目案例"
summary: 定时压缩并归档日志
order: 1
---

- 遍历日志目录
- zipfile 压缩归档
- 按日期命名
- 清理过期文件

```python
import zipfile
from pathlib import Path
from datetime import date

with zipfile.ZipFile(f"logs_{date.today()}.zip", "w") as z:
    for f in Path("logs").glob("*.log"):
        z.write(f)
```

**自查清单**
- [ ] 压缩日志
- [ ] 按日归档
