---
title: 大模型评估
category: ai
module: ai-llm
subcat: roadmap
timeline: false
level: medium
tier: extra
readMinutes: 12
tags: "大模型 LLM, evaluation"
summary: 基准与人工评测
order: 6
---

- MMLU/CEval 基准
-  hallucination 检测
- 自动化评测

```python
from datasets import load_dataset
ds = load_dataset('ceval/ceval-exam', 'computer_network')
print(ds['val'][0])
```

**自查清单**
- [ ] 跑基准
- [ ] 看分数
