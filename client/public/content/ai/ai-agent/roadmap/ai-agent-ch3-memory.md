---
title: 记忆机制
category: ai
module: ai-agent
subcat: roadmap
timeline: false
level: medium
tier: key
readMinutes: 12
tags: "Agent 智能体, memory"
summary: 短期与长期记忆
order: 4
---

- 对话历史缓存
- 向量长期记忆
- 摘要压缩

```python
class Memory:
    def __init__(self):
        self.buffer = []
    def add(self, msg):
        self.buffer.append(msg)
    def recall(self, k=5):
        return self.buffer[-k:]
```

**自查清单**
- [ ] 实现记忆
- [ ] 做检索
