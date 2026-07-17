---
title: 多智能体协作
category: ai
module: ai-agent
subcat: roadmap
timeline: false
level: hard
tier: extra
readMinutes: 14
tags: "Agent 智能体, multi-agent"
summary: 角色分工与通信
order: 5
---

- 角色设定
- 消息传递
- 协作编排

```python
agents = {'researcher': ..., 'writer': ...}
msg = agents['researcher'].run('调研主题')
result = agents['writer'].run(msg)
```

**自查清单**
- [ ] 搭多智能体
- [ ] 串联流程
