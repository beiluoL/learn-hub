---
title: 案例：模型上线为 API
category: ai
module: ai-deploy
subcat: cases
timeline: false
level: hard
tier: key
readMinutes: 24
tags: "推理部署, 项目案例"
summary: 量化+FastAPI+压测全流程
order: 1
---

- 导出并量化
- 起服务
- 压测达标

```bash
uvicorn serve:app --host 0.0.0.0 --port 8080 --workers 4
```

**自查清单**
- [ ] 完成部署
- [ ] 达标延迟
