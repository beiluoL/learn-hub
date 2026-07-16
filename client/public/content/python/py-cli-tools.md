---
title: Python 命令行工具开发
category: python
level: beginner
readMinutes: 14
tags: "argparse, click, typer, CLI"
summary: Python 命令行工具开发。
order: 32
---

命令行工具是自动化运维、数据处理和开发效率提升的核心手段。Python 生态提供了从标准库到第三方库的多层级 CLI 开发方案，从 `argparse` 基础解析到 `typer` 类型驱动开发，你可以根据项目复杂度选择合适的工具。

## argparse 参数解析

`argparse` 是 Python 标准库的命令行参数解析模块，无需额外依赖：

```python
# mytool.py
import argparse

def main():
    parser = argparse.ArgumentParser(
        description='文件批量重命名工具',
        epilog='示例: python mytool.py -d ./images -p IMG_ --dry-run'
    )
    parser.add_argument('-d', '--dir', required=True, help='目标目录')
    parser.add_argument('-p', '--prefix', default='file_', help='文件名前缀')
    parser.add_argument('-n', '--number', type=int, default=1, help='起始编号')
    parser.add_argument('--dry-run', action='store_true', help='预演模式')
    parser.add_argument('--version', action='version', version='v1.0.0')

    args = parser.parse_args()
    print(f'目录: {args.dir}, 前缀: {args.prefix}, 起始: {args.number}')

if __name__ == '__main__':
    main()
```

argparse 的优点是无依赖、稳定可靠；缺点是指定复杂的子命令和参数时需要大量样板代码，嵌套子命令的写法尤其繁琐。

## Click 装饰器风格 CLI

Click 使用装饰器将函数转为命令行命令，代码更加直观：

```python
# mytool.py
import click

@click.group()
def cli():
    """文件管理工具集"""
    pass

@cli.command()
@click.argument('source')
@click.argument('dest')
@click.option('--force', is_flag=True, help='强制覆盖')
@click.option('--workers', default=4, help='并发数')
def copy(source, dest, force, workers):
    """复制文件或目录"""
    click.echo(f'从 {source} 复制到 {dest}')
    if force:
        click.echo('强制模式开启')

@cli.command()
@click.option('--name', prompt='你的名字', help='用户名')
@click.option('--language', type=click.Choice(['py', 'js', 'go']))
def init(name, language):
    """初始化新项目"""
    click.echo(f'为 {name} 初始化 {language} 项目')

if __name__ == '__main__':
    cli()
```

Click 提供了 `prompt`（交互式输入）、`confirm`（确认提示）、`progressbar`（进度条）、`style`（终端样式）等功能，开箱即用。

## Typer 类型驱动 CLI

Typer 基于 Click 但更进一步，利用类型注解自动生成参数解析：

```python
# mytool.py
import typer
from typing import Optional
from enum import Enum

app = typer.Typer()

class Format(str, Enum):
    json = "json"
    csv = "csv"
    yaml = "yaml"

@app.command()
def convert(
    input_file: str = typer.Argument(..., help="输入文件路径"),
    output_file: Optional[str] = typer.Option(None, help="输出文件路径"),
    format: Format = typer.Option(Format.json, help="输出格式"),
    verbose: bool = typer.Option(False, "--verbose", "-v"),
):
    """文件格式转换工具"""
    typer.echo(f"转换: {input_file} -> {output_file or f'{input_file}.{format.value}'}")

@app.command()
def stats(
    path: str = typer.Argument(".", help="目标路径"),
    depth: int = typer.Option(1, min=1, max=10, help="扫描深度"),
):
    """目录统计"""
    typer.echo(f"统计 {path}, 深度 {depth}")

if __name__ == "__main__":
    app()
```

Typer 的核心优势：类型注解即文档、自动生成 `--help`、IDE 自动补全友好。它是构建现代 Python CLI 工具的首选，尤其在 FastAPI 项目的同生态中。

## 进度条 tqdm

```python
from tqdm import tqdm
import time

files = [f'file_{i}.dat' for i in range(100)]

for file in tqdm(files, desc='处理文件', unit='file'):
    process(file)
    time.sleep(0.02)

# 手动控制进度
with tqdm(total=1000, desc='下载') as pbar:
    for chunk in read_chunks():
        save(chunk)
        pbar.update(len(chunk))
```

## 彩色输出 Rich

```python
from rich.console import Console
from rich.table import Table
from rich.progress import track

console = Console()

# 彩色文本
console.print('[bold green]成功[/bold green] 任务完成')
console.print('[red]错误:[/red] 文件不存在')

# 表格
table = Table(title='任务状态')
table.add_column('ID', style='cyan')
table.add_column('名称', style='magenta')
table.add_column('状态')

for task in tasks:
    status_color = '[green]完成[/green]' if task.done else '[yellow]进行中[/yellow]'
    table.add_row(str(task.id), task.name, status_color)

console.print(table)

# Rich 进度条
from rich.progress import Progress
with Progress() as progress:
    task = progress.add_task('[cyan]处理...', total=100)
    while not progress.finished:
        progress.update(task, advance=1)
```

## 配置文件加载

```python
import yaml
from pathlib import Path

def load_config():
    """按优先级加载配置：环境变量 > 本地 config.yaml > 默认值"""
    default = {'host': 'localhost', 'port': 8000}

    config_path = Path('config.yaml')
    if config_path.exists():
        with open(config_path) as f:
            file_config = yaml.safe_load(f)
            default.update(file_config or {})

    # 环境变量覆盖
    import os
    if os.getenv('HOST'):
        default['host'] = os.getenv('HOST')

    return default
```

## 完整 CLI 工具示例

```python
#!/usr/bin/env python3
"""天气查询 CLI 工具"""
import typer
import requests
from rich.table import Table
from rich.console import Console

app = typer.Typer()
console = Console()

def fetch_weather(city: str) -> dict:
    resp = requests.get(f'https://api.weather.example.com/{city}')
    resp.raise_for_status()
    return resp.json()

@app.command()
def weather(city: str = typer.Argument(..., help='城市名称')):
    """查询城市天气"""
    with console.status('[bold green]查询中...'):
        data = fetch_weather(city)

    table = Table(title=f'{city} 天气')
    table.add_column('指标', style='cyan')
    table.add_column('数值', style='green')
    table.add_row('温度', f'{data["temp"]}°C')
    table.add_row('湿度', f'{data["humidity"]}%')
    table.add_row('风速', f'{data["wind_speed"]} m/s')
    console.print(table)

if __name__ == '__main__':
    app()
```

## 实际开发中的应用 / 常见问题

**argparse / Click / Typer 怎么选**：标准库脚本或需零依赖的场景用 argparse；中型 CLI 工具用 Click（更灵活的装饰器语法）；大型或多子命令的 CLI 工具用 Typer（类型安全 + 自动文档）。Typer 底层基于 Click，可以无缝迁移。

**CLI 工具的输出格式**：始终提供 `--json` 或 `--format` 选项输出机器可解析的格式，方便在 Shell 管道中使用（如 `mytool data | jq '.items[]'`）。

**跨平台注意事项**：路径处理使用 `pathlib.Path` 而非字符串拼接；避免使用 `os.system()`，改用 `subprocess.run()`；信号处理用 `signal` 模块实现 `Ctrl+C` 优雅退出。
