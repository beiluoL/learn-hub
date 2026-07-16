---
title: Python 日志体系与异常监控实践
category: python
level: intermediate
readMinutes: 16
tags: "logging, 日志, 结构化, 监控"
summary: Python 日志体系与异常监控实践。
order: 29
---

日志是生产环境诊断问题的基础设施。好的日志规范能让你在凌晨三点快速定位故障，坏的日志习惯会让你淹没在无意义的噪音中。Python 内置的 `logging` 模块功能完善，配合结构化日志和异常监控，可以构建可靠的观测体系。

## logging 五大组件

Python 的 logging 模块包含五个核心组件：

| 组件 | 作用 | 说明 |
|------|------|------|
| Logger | 日志记录入口 | 应用程序直接使用的接口 |
| Handler | 日志输出目标 | 控制台、文件、邮件、HTTP 等 |
| Filter | 日志过滤器 | 比日志级别更细粒度的过滤 |
| Formatter | 日志格式 | 定义日志输出格式 |
| Level | 日志级别 | DEBUG < INFO < WARNING < ERROR < CRITICAL |

它们之间的数据流是：**Logger -> Filter -> Handler -> Filter -> Formatter -> 输出目标**。

## 按模块配置 Logger

推荐为每个模块创建独立的 logger，使用 `__name__` 保持模块间的层级关系：

```python
# config/logging_config.py
import logging.config

LOGGING_CONFIG = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'standard': {
            'format': '%(asctime)s [%(levelname)s] %(name)s: %(message)s',
            'datefmt': '%Y-%m-%d %H:%M:%S',
        },
    },
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
            'level': 'INFO',
            'formatter': 'standard',
            'stream': 'ext://sys.stdout',
        },
        'file': {
            'class': 'logging.handlers.RotatingFileHandler',
            'level': 'DEBUG',
            'formatter': 'standard',
            'filename': 'app.log',
            'maxBytes': 10 * 1024 * 1024,  # 10MB
            'backupCount': 5,
        },
    },
    'loggers': {
        '': {  # root logger
            'handlers': ['console', 'file'],
            'level': 'INFO',
        },
        'myapp.db': {
            'level': 'DEBUG',
        },
        'myapp.api': {
            'level': 'INFO',
        },
    },
}

logging.config.dictConfig(LOGGING_CONFIG)

# 使用
import logging
logger = logging.getLogger(__name__)  # __name__ 自动匹配模块层级
logger.info('服务启动成功')
```

**注意**：始终使用 `logging.getLogger(__name__)` 而非 `logging.info()`。后者使用的是 root logger，无法按模块区分日志来源。

## 多 Handler：文件 / 控制台 / 邮件

生产环境的日志通常输出到多个目标：

```python
import logging

logger = logging.getLogger('myapp')

# 控制台：开发期查看，ERROR 级别
console_handler = logging.StreamHandler()
console_handler.setLevel(logging.ERROR)
console_handler.setFormatter(logging.Formatter('%(levelname)s: %(message)s'))
logger.addHandler(console_handler)

# 文件：全量日志，DEBUG 级别
file_handler = logging.handlers.RotatingFileHandler(
    'app.log', maxBytes=10*1024*1024, backupCount=5
)
file_handler.setLevel(logging.DEBUG)
logger.addHandler(file_handler)

# 邮件：CRITICAL 级别即时告警
mail_handler = logging.handlers.SMTPHandler(
    mailhost='smtp.example.com',
    fromaddr='alert@example.com',
    toaddrs=['ops@example.com'],
    subject='[CRITICAL] Application Error'
)
mail_handler.setLevel(logging.CRITICAL)
logger.addHandler(mail_handler)
```

**日志级别使用指南**：DEBUG 用于开发调试细节；INFO 记录业务流程关键节点（"用户登录"、"订单创建"）；WARNING 记录潜在问题（"磁盘使用率 85%"）；ERROR 记录需要关注但系统仍可运行的错误；CRITICAL 记录系统级故障。

## 结构化日志

传统日志依赖正则解析，结构化日志（如 JSON 格式）可直接被日志系统索引和搜索：

```python
# 安装：pip install python-json-logger
import logging
from pythonjsonlogger import jsonlogger

handler = logging.StreamHandler()
formatter = jsonlogger.JsonFormatter(
    '%(asctime)s %(name)s %(levelname)s %(message)s'
)
handler.setFormatter(formatter)

logger = logging.getLogger()
logger.addHandler(handler)

# 使用 extra 传入结构化字段
logger.info('订单已创建', extra={
    'order_id': 'ORD-12345',
    'user_id': 42,
    'amount': 99.99
})
```

输出的 JSON 日志可被 ELK Stack（Elasticsearch/Logstash/Kibana）或 Grafana Loki 直接消费。

## Sentry 集成

Sentry 是异常监控的事实标准，与 Python 日志无缝集成：

```python
# 安装：pip install sentry-sdk
import sentry_sdk
from sentry_sdk.integrations.logging import LoggingIntegration

sentry_sdk.init(
    dsn='https://xxx@xxx.ingest.sentry.io/xxx',
    traces_sample_rate=0.1,  # 10% 性能追踪采样
    environment='production',
    integrations=[
        LoggingIntegration(
            level=logging.INFO,        # 捕获此级别的日志
            event_level=logging.ERROR  # 将此级别的日志作为事件发送
        ),
    ],
)

# 之后所有 ERROR 级别日志自动发送到 Sentry
logger.error('支付失败', extra={'order_id': 'ORD-123'})
```

## 日志轮转 RotatingFileHandler

```python
# 按大小轮转
handler = logging.handlers.RotatingFileHandler(
    'app.log', maxBytes=10*1024*1024, backupCount=5
)

# 按时间轮转
handler = logging.handlers.TimedRotatingFileHandler(
    'app.log',
    when='midnight',      # 每天午夜轮转
    interval=1,
    backupCount=30,       # 保留 30 天
    encoding='utf-8'
)
```

## 不要在循环里打日志

```python
# 不好：循环内打日志
for item in large_dataset:
    logger.debug(f'处理: {item["id"]}')
    process(item)

# 好：汇总后输出
processed = 0
errors = []
for item in large_dataset:
    try:
        process(item)
        processed += 1
    except Exception as e:
        errors.append(str(e))

logger.info(f'批处理完成: 成功 {processed}, 失败 {len(errors)}')
if errors:
    logger.error(f'失败详情: {errors[:10]}')
```

循环内打日志的代价不只是 IO——日志格式化、字符串插值和文件写入都会累积。在百万量级的数据处理中，这可以造成数倍的性能差距。

## 实际开发中的应用 / 常见问题

**生产环境日志的最佳实践**：
1. INFO 级别作为默认，DEBUG 仅在问题排查时开启
2. 敏感信息（密码、token、身份证号）切勿写入日志
3. 记录关键上下文（trace_id、user_id、request_id）便于追踪
4. 使用结构化日志便于聚合分析

**日志与监控的关系**：日志记录发生了什么（What），指标记录系统的量化状态（How Many），追踪记录请求的执行路径（How）。三者是互补的观测手段，不是替代关系。生产环境应同时具备日志、指标、追踪三件套。

**日志性能优化**：使用 `%s` 格式化比 f-string 更高效（logging 模块的惰性求值）；避免在日志中使用 `pprint` 或 `json.dumps` 等开销大的操作，改用结构化日志的 `extra` 参数。
