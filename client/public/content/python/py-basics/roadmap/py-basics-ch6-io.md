---
title: 文件读写
category: python
module: py-basics
subcat: roadmap
timeline: false
level: medium
tier: key
readMinutes: 12
tags: Python 基础语法
summary: with 上下文管理器安全读写文件
order: 7
---

- open() 打开文件，with 自动关闭
- r/w/a 读写追加模式
- read() / readlines() / write()
- encoding="utf-8" 指定编码
- pathlib 更现代的路径操作

```python
from pathlib import Path

p = Path("data.txt")
p.write_text("第一行
第二行", encoding="utf-8")
for line in p.read_text(encoding="utf-8").splitlines():
    print(line)
```

**自查清单**
- [ ] 用 with 读写文件不漏关
- [ ] 能按行读取文本
- [ ] 理解 utf-8 编码
