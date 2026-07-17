---
title: 微调方法
category: ai
module: ai-llm
subcat: roadmap
timeline: false
level: hard
tier: key
readMinutes: 16
tags: "大模型 LLM, finetune, lora"
summary: 全量与参数高效微调
order: 3
---

- 全参数微调
- LoRA/QLoRA
- 数据格式构造

```python
from peft import LoraConfig, get_peft_model
cfg = LoraConfig(r=8, lora_alpha=16, target_modules=['q_proj', 'v_proj'])
model = get_peft_model(base_model, cfg)
model.print_trainable_parameters()
```

**自查清单**
- [ ] 配置 LoRA
- [ ] 算可训练参数量
