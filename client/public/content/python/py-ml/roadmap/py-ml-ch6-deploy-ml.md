---
title: 模型保存与部署
category: python
module: py-ml
subcat: roadmap
timeline: false
level: hard
tier: extra
readMinutes: 13
tags: "ML/DL 基础 (scikit-learn/TensorFlow/PyTorch)"
summary: 导出与服务化
order: 7
---

- joblib 保存 sklearn
- SavedModel / .pt 导出
- FastAPI 加载推理
- 批处理与流式

```python
import joblib

joblib.dump(model, "model.pkl")
loaded = joblib.load("model.pkl")
print(loaded.predict(X[:1]))
```

**自查清单**
- [ ] 保存模型
- [ ] 加载并推理
