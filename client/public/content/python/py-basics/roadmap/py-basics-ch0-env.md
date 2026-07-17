---
title: 环境与第一个程序
category: python
module: py-basics
subcat: roadmap
timeline: false
level: easy
tier: basic
readMinutes: 12
tags: "Python 基础语法, 环境, venv"
summary: 搭建 Python 运行环境并运行第一段代码
order: 1
---

Python 以简洁著称，先装好解释器再敲下第一行代码。

- 安装 Python 3.10+ 并配置 PATH
- 使用 python / python3 命令运行脚本
- 认识 REPL 交互式解释器
- 用 print() 输出内容
- 掌握 python -m venv 创建虚拟环境

```bash
python3 --version
python3 -m venv .venv
source .venv/bin/activate
python3 -c "print('hello')"
```

> 建议每个项目独立虚拟环境，避免依赖冲突。

**自查清单**
- [ ] 能打印出 hello
- [ ] 成功创建并激活虚拟环境
- [ ] 知道如何退出虚拟环境
