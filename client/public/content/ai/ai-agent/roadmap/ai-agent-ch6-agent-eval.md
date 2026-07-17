---
title: 智能体评估
category: ai
module: ai-agent
subcat: roadmap
timeline: false
level: hard
tier: extra
readMinutes: 11
tags: "Agent 智能体, evaluation"
summary: 任务成功率与轨迹
order: 7
---

- 成功率指标
- 轨迹回放
- 成本与延迟

```python
def success_rate(trials):
    ok = sum(1 for t in trials if t['done'])
    return ok / len(trials)
```

**自查清单**
- [ ] 算成功率
- [ ] 分析轨迹
