---
title: 模型微调：Fine-tuning 与 LoRA
category: ai
level: advanced
readMinutes: 12
tags: 微调, LoRA, PEFT, 训练
summary: 理解全量微调与参数高效微调（LoRA）的取舍，以及何时该微调、何时该用 RAG。
order: 6
prereq: ai/ai-prompt
---

# 模型微调：Fine-tuning 与 LoRA

微调是在预训练大模型基础上，用领域数据继续训练，让模型习得特定风格、格式或任务能力。

## 一、微调 vs RAG vs Prompt

| 手段 | 解决什么 | 成本 |
| --- | --- | --- |
| Prompt 工程 | 引导既有能力 | 最低 |
| RAG | 补充"最新/私有知识" | 中 |
| 微调 | 改变"行为/风格/格式" | 高 |

> 经验法则：**知识缺失用 RAG，行为/格式不对才微调**。二者可叠加。

## 二、全量微调的问题

全量微调更新所有参数，显存与存储开销巨大（每个任务都要存一份完整权重），中小团队难以负担。

## 三、LoRA：参数高效微调

LoRA（Low-Rank Adaptation）冻结原始权重，只在旁路训练两个低秩矩阵 `A`、`B`，用 `ΔW = B·A` 近似权重更新：

```text
输出 = W₀·x + (B·A)·x
       └原权重┘  └仅训练这部分（参数量降至 <1%）┘
```

优点：

- 只训练极少参数，单卡可跑。
- 产出的 adapter 只有几十 MB，可热插拔、多任务共存。
- 效果接近全量微调。

## 四、典型流程

1. 准备高质量指令数据（`instruction / input / output`）——质量 > 数量。
2. 选基座模型与 LoRA 超参（rank、alpha、target modules）。
3. 训练并在验证集上评估。
4. 合并 adapter 或运行时加载。

```python
from peft import LoraConfig, get_peft_model

config = LoraConfig(r=8, lora_alpha=16, target_modules=["q_proj", "v_proj"])
model = get_peft_model(base_model, config)
model.print_trainable_parameters()  # trainable: <1%
```

> 数据质量决定微调成败。先用 RAG + Prompt 把能力压榨到极限，再考虑微调。
