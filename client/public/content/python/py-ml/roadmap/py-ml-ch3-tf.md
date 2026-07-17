---
title: TensorFlow 入门
category: python
module: py-ml
subcat: roadmap
timeline: false
level: hard
tier: key
readMinutes: 16
tags: "ML/DL 基础 (scikit-learn/TensorFlow/PyTorch)"
summary: Keras 顺序模型
order: 4
---

- Sequential 堆叠层
- compile 指定损失优化器
- fit 训练
- evaluate 评估

```python
import tensorflow as tf

model = tf.keras.Sequential([
    tf.keras.layers.Dense(64, activation="relu", input_shape=(10,)),
    tf.keras.layers.Dense(1, activation="sigmoid"),
])
model.compile(optimizer="adam", loss="binary_crossentropy")
model.fit(X, y, epochs=5, batch_size=32)
```

**自查清单**
- [ ] 搭建顺序模型
- [ ] 完成训练
