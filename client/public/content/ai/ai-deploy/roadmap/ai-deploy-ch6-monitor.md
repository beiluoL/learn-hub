---
title: 监控与成本
category: ai
module: ai-deploy
subcat: roadmap
timeline: false
level: medium
tier: extra
readMinutes: 11
tags: "推理部署, monitor"
summary: 指标、日志与计费
order: 7
---

- 延迟与吞吐
- 错误率监控
- Token 成本统计

```python
import time
t0 = time.time()
out = model(x)
print('latency_ms', (time.time() - t0) * 1000)
```

**自查清单**
- [ ] 加埋点
- [ ] 算成本
