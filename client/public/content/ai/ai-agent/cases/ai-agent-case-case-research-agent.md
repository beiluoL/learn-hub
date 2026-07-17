---
title: 案例：自动化调研助手
category: ai
module: ai-agent
subcat: cases
timeline: false
level: hard
tier: key
readMinutes: 25
tags: "Agent 智能体, 项目案例"
summary: 串联检索、写稿与校验
order: 1
---

- 搜索工具调用
- 生成报告
- 事实校验

```python
plan = agent.plan('调研向量数据库')
for step in plan:
    tool_out = agent.call_tool(step)
    report += agent.write(step, tool_out)
print(agent.verify(report))
```

**自查清单**
- [ ] 跑通流程
- [ ] 产出报告
