---
title: Celery 异步任务与定时调度实战
category: python
level: advanced
readMinutes: 18
tags: "Celery, 异步任务, 定时, 消息队列"
summary: Celery 异步任务与定时调度实战。
order: 33
prereq: python/py-basics
---

Celery 是 Python 生态中最成熟的分布式任务队列，用于处理异步任务和定时调度。从注册后的欢迎邮件，到每晚的数据报表生成，到电商的库存同步——任何不需要在 HTTP 请求周期内完成的操作，都可以委托给 Celery。

## Celery 架构

Celery 的架构由五个角色组成：

```
Producer(生产者) -> Broker(消息队列) -> Worker(消费者) -> Result Backend(结果存储)
                                            |
                                        Beat(定时调度器)
```

| 角色 | 功能 | 典型实现 |
|------|------|---------|
| Producer | 产生任务的应用 | Web 应用、脚本 |
| Broker | 消息中转 | Redis、RabbitMQ |
| Worker | 执行任务 | Celery Worker 进程 |
| Result Backend | 存储任务结果 | Redis、数据库 |
| Beat | 定时触发任务 | Celery Beat 进程 |

消息流程：应用将任务放入 Broker -> Worker 从 Broker 拉取任务并执行 -> 完成后将结果写入 Result Backend。

## Broker 选型

```python
# celeryconfig.py
# Redis（轻量，适合中小规模）
broker_url = 'redis://localhost:6379/0'
result_backend = 'redis://localhost:6379/1'

# RabbitMQ（可靠性最高，适合高可靠需求的生产环境）
broker_url = 'amqp://user:pass@localhost:5672//'
```

**Redis vs RabbitMQ**：Redis 配置简单，延迟低，适合大多数场景；RabbitMQ 提供了消息确认（ACK）、持久化、优先级等高级特性，可靠性更高。如果不确定，从 Redis 开始。

## 任务定义与调用

```python
# tasks.py
from celery import Celery

app = Celery('myapp')
app.config_from_object('celeryconfig')

@app.task(bind=True, max_retries=3, default_retry_delay=60)
def send_welcome_email(self, user_email: str, user_name: str):
    """发送欢迎邮件，支持自动重试"""
    try:
        email_service.send(to=user_email, subject='欢迎注册', body=f'你好 {user_name}')
    except Exception as e:
        # 引发 retry 异常，Celery 会自动重试
        raise self.retry(exc=e)

@app.task
def generate_monthly_report(user_id: int, month: str):
    """生成月度报表"""
    data = query_user_data(user_id, month)
    report = build_pdf_report(data)
    return report.url  # 结果存入 Result Backend
```

调用任务的方式：

```python
# 方式一：delay() — 最简单，立即投递
send_welcome_email.delay('alice@example.com', 'Alice')

# 方式二：apply_async() — 支持更多参数
generate_monthly_report.apply_async(
    args=[42, '2024-01'],
    countdown=10,           # 10 秒后执行
    expires=300,            # 5 分钟超时则丢弃
    queue='reports',        # 指定队列
    priority=5,             # 优先级（需 RabbitMQ）
)

# 方式三：签名（signature）— 可组合的任务蓝图
from celery import chain, group, chord

# chain：顺序执行
chain(
    fetch_data.s(),
    transform_data.s(),
    save_result.s(),
)()

# group：并发执行
group(fetch_data.s(user_id) for user_id in user_ids)()

# chord：group + callback（所有任务完成后执行回调）
chord(
    group(process_page.s(i) for i in range(10)),
    merge_results.s()
)()
```

## 任务重试与幂等

Celery 任务应设计为幂等的——重试多次和执行一次产生相同的结果：

```python
@app.task(bind=True, max_retries=3, default_retry_delay=10)
def process_payment(self, order_id: str, amount: float):
    try:
        # 幂等设计：基于 order_id 的唯一约束
        payment_gateway.charge(order_id=order_id, amount=amount)
    except GatewayTimeout:
        raise self.retry(exc=e)       # 自动重试
    except DuplicateError:
        logger.info(f'支付 {order_id} 已经处理，跳过')
        return  # 幂等：重复调用安全
```

**注意**：`self.retry()` 会将当前任务重新放入队列，而非原地重试。重试次数由 `max_retries` 控制，超出后任务进入失败状态。

## 定时任务 Beat Schedule

```python
# celeryconfig.py (Celery 5.x)
from celery.schedules import crontab

beat_schedule = {
    'send-daily-summary': {
        'task': 'tasks.send_daily_summary',
        'schedule': crontab(hour=9, minute=0),  # 每天 9:00
    },
    'cleanup-sessions': {
        'task': 'tasks.cleanup_expired_sessions',
        'schedule': 3600.0,  # 每小时
        'args': (30,),        # sessions 过期天数
    },
    'weekly-report': {
        'task': 'tasks.generate_weekly_report',
        'schedule': crontab(hour=8, minute=30, day_of_week=1),  # 每周一 8:30
    },
}
```

启动 Beat（需要独立进程）：

```bash
celery -A myapp beat -l INFO
celery -A myapp worker -l INFO  # 另一个终端
```

## Flower 监控

Flower 是 Celery 的 Web 监控面板：

```bash
pip install flower
celery -A myapp flower --port=5555
# 访问 http://localhost:5555
```

Flower 可以查看：实时任务队列、worker 状态、任务结果和 traceback、任务耗时统计图。

## 代码示例：邮件异步发送

```python
# app.py — Web 应用（Flask/FastAPI）
from tasks import send_welcome_email

@app.post('/register')
async def register(email: str, name: str):
    user = create_user(email, name)
    # 异步发送欢迎邮件
    send_welcome_email.delay(email, name)
    return {'message': '注册成功'}


# tasks.py — Celery 任务
@app.task(bind=True, max_retries=3)
def send_welcome_email(self, email: str, name: str):
    try:
        send_email(
            to=email,
            subject='欢迎加入！',
            html=render_template('welcome.html', name=name)
        )
        logger.info(f'欢迎邮件已发送: {email}')
    except SMTPException as e:
        logger.error(f'邮件发送失败: {email}, {e}')
        raise self.retry(exc=e, countdown=30)
```

## 代码示例：数据报表生成

```python
@app.task(bind=True, max_retries=2)
def generate_user_report(self, user_id: int, month: str):
    """为指定用户生成月度财务报告"""
    # 1. 收集数据
    transactions = Transaction.query.filter(
        Transaction.user_id == user_id,
        Transaction.month == month
    ).all()

    # 2. 计算统计
    stats = {
        'total_income': sum(t.amount for t in transactions if t.amount > 0),
        'total_expense': abs(sum(t.amount for t in transactions if t.amount < 0)),
        'transaction_count': len(transactions),
    }

    # 3. 生成 PDF
    pdf_path = f'/reports/{user_id}/{month}.pdf'
    generate_pdf(stats, pdf_path)

    # 4. 通知用户
    send_notification.delay(user_id, f'报表已生成: {pdf_path}')

    return {'user_id': user_id, 'month': month, 'path': pdf_path}
```

## 实际开发中的应用 / 常见问题

**任务应该多"重"**：Celery 不适合微秒级的操作（任务投递本身有延迟）。任务执行时间应在 1 秒到 30 分钟之间。太短的任务用后台线程，太长的任务拆分为子任务链。

**Redis Broker 的可见性问题**：Redis 作为 Broker 时，如果 Worker 崩溃，已拉取但未执行完的任务会丢失。对于需要"至少一次"投递保证的场景，使用 RabbitMQ 的 ACK 机制。Redis 5.0+ 的 Streams 类型改善了这个问题。

**结果后端的存储策略**：不要将大文件存入 Result Backend（Redis 有内存限制）。改为将文件路径写入 Backend，文件本身存对象存储（S3/MinIO）。设置 `result_expires` 定期清理过期结果。
