---
title: Python 包管理与虚拟环境最佳实践
category: python
level: beginner
readMinutes: 14
tags: "pip, venv, poetry, pyproject.toml"
summary: Python 包管理与虚拟环境最佳实践。
order: 27
prereq: python/py-basics
---

包管理是 Python 项目的基础设施。从早期的 `pip + requirements.txt` 到现代的 `pyproject.toml + poetry`，Python 包管理生态经历了多次演进。选择合适的工具能显著提升开发效率和项目可维护性。

## pip 与 venv 基础

虚拟环境是 Python 项目的隔离沙箱，每个项目独立的依赖，避免版本冲突：

```bash
# 创建虚拟环境
python -m venv .venv

# 激活虚拟环境
source .venv/bin/activate    # Linux/macOS
.venv\Scripts\activate       # Windows

# 安装依赖
pip install requests pandas

# 导出当前环境
pip freeze > requirements.txt

# 从文件安装
pip install -r requirements.txt

# 退出虚拟环境
deactivate
```

**注意**：`pip freeze` 会将所有已安装的包（包括间接依赖）写入 `requirements.txt`，这意味着你无法区分直接依赖和间接依赖。当需要升级某个包时，这种"扁平化"的依赖列表会给版本管理带来困难。

## Poetry：现代依赖管理

Poetry 是当前 Python 社区推荐的依赖管理工具，解决了 pip 的依赖解析问题和 lock 文件需求：

```bash
# 安装 Poetry
curl -sSL https://install.python-poetry.org | python3 -

# 创建新项目
poetry new my-project        # 生成标准项目骨架
cd my-project

# 在已有项目中初始化
poetry init

# 添加依赖
poetry add requests                    # 正式依赖
poetry add pytest --group dev          # 开发依赖

# 移除依赖
poetry remove requests

# 安装所有依赖（根据 lock 文件）
poetry install

# 运行脚本
poetry run python main.py

# 进入虚拟环境
poetry shell
```

## pyproject.toml vs setup.py

`pyproject.toml` 是 Python 社区的标准化配置格式（PEP 517/518/621），将多个工具的配置统一到一个文件中：

```toml
[build-system]
requires = ["poetry-core"]
build-backend = "poetry.core.masonry.api"

[tool.poetry]
name = "my-project"
version = "0.1.0"
description = "项目描述"
authors = ["Your Name <you@example.com>"]

[tool.poetry.dependencies]
python = "^3.10"
fastapi = "^0.109.0"
sqlalchemy = "^2.0"

[tool.poetry.group.dev.dependencies]
pytest = "^8.0"
black = "^24.0"
ruff = "^0.3"

[tool.black]
line-length = 100

[tool.ruff]
line-length = 100
```

**pyproject.toml vs setup.py 对比**：

| 特性 | pyproject.toml | setup.py |
|------|---------------|----------|
| 格式 | TOML（声明式） | Python（命令式） |
| 标准化 | PEP 517/518 | 历史遗留 |
| 依赖管理 | 配合 Poetry/PDM/Hatch | 需配合 setuptools |
| 工具配置 | 统一文件 | 分散在多个文件 |

## 本地包开发模式

开发本地库时，使用 `pip install -e .`（可编辑安装）将包以符号链接方式安装，修改源码无需重新安装：

```bash
# 项目结构
my-package/
    pyproject.toml
    src/
        my_package/
            __init__.py
            module.py

# 可编辑安装
cd my-package
pip install -e .

# 或使用 Poetry
poetry install  # 自动以可编辑模式安装
```

## 版本约束语法

Python 包管理工具支持灵活的版本约束：

```
^1.2.3    # 兼容版本：>=1.2.3, <2.0.0 (Poetry 推荐)
~=1.2.3   # 兼容版本：>=1.2.3, ==1.2.* (PEP 440)
>=1.2,<2.0  # 显式范围
==1.2.3   # 精确版本（不推荐，过于严格）
@latest   # 始终最新（不推荐，不可重现）
```

**版本约束建议**：对稳定 API 的库使用 `^` 约束，允许次要/补丁更新；对 API 变动频繁的库使用得更精确的范围；将关键依赖锁定在 poetry.lock 或 requirements-lock.txt 中。

## 私有 PyPI 与镜像加速

企业环境通常需要私有 PyPI 或镜像加速：

```toml
# pyproject.toml (Poetry)
[[tool.poetry.source]]
name = "private"
url = "https://pypi.example.com/simple/"
priority = "supplemental"

[[tool.poetry.source]]
name = "tsinghua"
url = "https://pypi.tuna.tsinghua.edu.cn/simple/"
```

```bash
# pip 使用临时镜像
pip install -i https://mirrors.aliyun.com/pypi/simple/ requests

# pip 持久化配置（~/.pip/pip.conf）
# [global]
# index-url = https://mirrors.aliyun.com/pypi/simple/
```

## Docker 中的包管理

在 Docker 镜像中，包管理的目标是减小镜像体积和提高构建速度：

```dockerfile
FROM python:3.12-slim

WORKDIR /app

# 利用 Docker 层缓存：先复制依赖文件
COPY pyproject.toml poetry.lock ./
RUN pip install poetry && poetry install --no-dev --no-root

# 再复制源码
COPY src/ ./src/
RUN poetry install --no-dev
```

**关键优化**：
1. 先复制依赖文件再复制源码，利用 Docker 缓存层
2. 使用 multi-stage build 排除构建依赖
3. 不要使用 `--no-cache-dir`，让 pip 缓存跨层复用
4. 清理 `~/.cache/pip` 和 `~/.cache/pypoetry` 减小镜像体积

## 实际开发中的应用 / 常见问题

**requirements.txt vs poetry.lock**：`requirements.txt` 是扁平化的依赖快照，不区分直接和间接依赖；`poetry.lock` 记录了完整的依赖图和哈希校验，确保了跨环境的一致性。对于团队协作项目，强烈推荐使用 Poetry 或 PDM 替代 `pip freeze`。

**依赖冲突排查**：当 pip 报告依赖冲突时，使用 `pip check` 检查不一致性；Poetry 的依赖解析器更智能，会给出详细的冲突原因。使用 `pipdeptree` 可视化依赖树帮助排查。

**虚拟环境的命名与位置**：将虚拟环境放在项目内（如 `.venv/`）而非全局目录，好处是每个项目自包含，删除项目即可清理虚拟环境。VS Code 等 IDE 也默认在项目根目录寻找 `.venv`。
