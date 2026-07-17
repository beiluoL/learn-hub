---
title: 工具调用
category: ai
module: ai-agent
subcat: roadmap
timeline: false
level: medium
tier: key
readMinutes: 12
tags: "Agent 智能体, tools"
summary: 函数声明与执行
order: 2
---

- 定义工具 schema
- 模型返回调用
- 安全执行

```json
{
  "name": "get_weather",
  "parameters": {
    "type": "object",
    "properties": {"city": {"type": "string"}},
    "required": ["city"]
  }
}
```

**自查清单**
- [ ] 定义 schema
- [ ] 解析调用
