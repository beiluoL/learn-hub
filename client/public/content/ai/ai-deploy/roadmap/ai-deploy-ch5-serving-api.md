---
title: API 服务化
category: ai
module: ai-deploy
subcat: roadmap
timeline: false
level: medium
tier: core
readMinutes: 12
tags: "推理部署, api"
summary: FastAPI 封装与并发
order: 6
---

- 请求校验
- 异步处理
- 限流与监控

```python
from fastapi import FastAPI
app = FastAPI()
@app.post('/predict')
def predict(x: list[float]):
    return {'out': model(x).tolist()}
```

**自查清单**
- [ ] 写接口
- [ ] 做压测
