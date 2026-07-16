---
question: 模型量化（Quantization）是什么？INT8/INT4 有什么利弊？
category: ai
difficulty: middle
tags: "量化, 部署, 推理"
order: 12
---

**量化：**把模型权重从高精度（FP16/BF16）转为低精度（INT8/INT4），降低显存与计算量。

**利弊：**

-   优点：显存占用大幅下降（如 7B 模型 INT4 仅约 4GB）、推理更快、可上消费级显卡/端侧
-   缺点：精度略有损失，极端低比特（如 2bit）可能明显退化；需选合适量化方法（GPTQ/AWQ/GGUF）

实践：对话/通用任务 INT4 通常可接受；对精度敏感任务保留 INT8 或 FP16。
