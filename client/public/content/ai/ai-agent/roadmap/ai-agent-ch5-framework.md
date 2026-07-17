---
title: Agent 框架
category: ai
module: ai-agent
subcat: roadmap
timeline: false
level: medium
tier: core
readMinutes: 13
tags: "Agent 智能体, framework"
summary: LangChain/LangGraph 简介
order: 6
---

- Chain 与节点
- 状态图编排
- 可观测性

```python
from langgraph.graph import StateGraph
g = StateGraph(dict)
g.add_node('call_tool', lambda s: s)
g.set_entry_point('call_tool')
app = g.compile()
```

**自查清单**
- [ ] 用框架
- [ ] 画状态图
