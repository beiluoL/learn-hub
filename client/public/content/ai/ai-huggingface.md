---
title: Hugging Face 生态实战
category: ai
level: intermediate
readMinutes: 16
tags: "HuggingFace, 模型库, Transformers, 微调"
summary: Hugging Face 生态实战：模型查找、加载与使用。
order: 27
prereq:
---

## Hugging Face 概述

Hugging Face 已成为 AI/ML 领域的核心平台，集模型托管、数据集共享、应用演示于一体。其 ecosystem 围绕三个核心组件构建：

- **Hub**：模型和数据集的开源仓库（类似 GitHub for ML）
- **Transformers**：预训练模型的统一接口库
- **Datasets**：高效的数据集加载与处理

## Hugging Face Hub

Hub 托管了数十万预训练模型和数万数据集。在 Hub 上搜索模型时关注以下指标：

| 指标 | 含义 | 参考阈值 |
|------|------|---------|
| Downloads | 下载量，反映流行度 | > 10K 较活跃 |
| Likes | 社区认可度 | > 50 |
| Model Card | 文档完整度 | 必备 |
| Updated | 最后更新时间 | 近 3 个月 |

搜索示例：`model_type:bert task:text-classification language:zh` 筛选中文文本分类的 BERT 模型。

## Transformers 库核心用法

### Pipeline：开箱即用

Pipeline 将预处理、模型推理、后处理封装为一行代码：

```python
from transformers import pipeline

# 文本分类
classifier = pipeline(
    "sentiment-analysis",
    model="uer/roberta-base-finetuned-jd-binary-chinese"
)
results = classifier("这个产品质量不错，我很满意。")
print(results)  # [{'label': 'positive', 'score': 0.998}]

# 命名实体识别
ner = pipeline(
    "ner",
    model="dslim/bert-base-NER",
    aggregation_strategy="simple"
)
entities = ner("Apple was founded by Steve Jobs in California.")
for e in entities:
    print(f"{e['word']}: {e['entity_group']} ({e['score']:.3f})")

# 文本生成
generator = pipeline(
    "text-generation",
    model="Qwen/Qwen2.5-1.5B-Instruct",
    device_map="auto"
)
output = generator(
    "解释人工智能的原理:",
    max_new_tokens=200,
    temperature=0.7
)
print(output[0]["generated_text"])
```

### Tokenizer 与 Model 分离使用

```python
from transformers import AutoTokenizer, AutoModelForSequenceClassification
import torch

model_name = "bert-base-chinese"
tokenizer = AutoTokenizer.from_pretrained(model_name)
model = AutoModelForSequenceClassification.from_pretrained(
    model_name,
    num_labels=2
)

# Tokenize
texts = ["这部电影非常精彩", "服务态度太差了"]
inputs = tokenizer(
    texts,
    padding=True,
    truncation=True,
    max_length=128,
    return_tensors="pt"
)

# 推理
with torch.no_grad():
    outputs = model(**inputs)
    probabilities = torch.softmax(outputs.logits, dim=-1)
    predictions = torch.argmax(probabilities, dim=-1)

print(f"预测标签: {predictions.tolist()}")
print(f"置信度: {probabilities.max(dim=-1).values.tolist()}")
```

**关键注意**：`from_pretrained` 第一次调用时会从 Hub 下载模型权重到缓存目录。对于大型模型（7B+），建议先手动下载或用 HuggingFace 镜像加速。

### 模型加载策略

```python
from transformers import AutoModelForCausalLM

# FP16 半精度（节省 50% 显存）
model = AutoModelForCausalLM.from_pretrained(
    "Qwen/Qwen2.5-7B-Instruct",
    torch_dtype=torch.float16,
    device_map="auto"
)

# INT8 量化加载
model = AutoModelForCausalLM.from_pretrained(
    "Qwen/Qwen2.5-7B-Instruct",
    load_in_8bit=True,
    device_map="auto"
)

# INT4 量化加载
from transformers import BitsAndBytesConfig

quantization_config = BitsAndBytesConfig(
    load_in_4bit=True,
    bnb_4bit_compute_dtype=torch.float16,
    bnb_4bit_use_double_quant=True,
    bnb_4bit_quant_type="nf4"
)

model = AutoModelForCausalLM.from_pretrained(
    "Qwen/Qwen2.5-7B-Instruct",
    quantization_config=quantization_config,
    device_map="auto"
)
```

## Datasets 库

```python
from datasets import load_dataset, Dataset

# 加载 HuggingFace Hub 上的数据集
dataset = load_dataset("imdb", split="train[:1000]")
print(f"数据集大小: {len(dataset)}")
print(f"列: {dataset.column_names}")
print(f"第一条样本: {dataset[0]}")

# 数据处理
def preprocess_function(examples):
    return tokenizer(
        examples["text"],
        truncation=True,
        padding="max_length",
        max_length=512
    )

tokenized_dataset = dataset.map(
    preprocess_function,
    batched=True,
    remove_columns=dataset.column_names
)

# 从本地数据创建 Dataset
custom_data = Dataset.from_dict({
    "text": ["文本 1", "文本 2", "文本 3"],
    "label": [0, 1, 1]
})
```

## Trainer API 微调

HuggingFace 的 Trainer 封装了完整的训练流程，极大简化了微调过程：

```python
from transformers import (
    AutoModelForSequenceClassification,
    Trainer,
    TrainingArguments
)

# 训练参数配置
training_args = TrainingArguments(
    output_dir="./results",
    num_train_epochs=3,
    per_device_train_batch_size=16,
    per_device_eval_batch_size=32,
    warmup_steps=500,
    weight_decay=0.01,
    logging_dir="./logs",
    logging_steps=100,
    eval_strategy="steps",
    eval_steps=500,
    save_strategy="steps",
    save_steps=500,
    load_best_model_at_end=True,
    metric_for_best_model="accuracy",
    fp16=True,  # 混合精度训练
    dataloader_num_workers=4,
)

# 开始训练
trainer = Trainer(
    model=model,
    args=training_args,
    train_dataset=train_dataset,
    eval_dataset=eval_dataset,
    compute_metrics=compute_metrics,
)

trainer.train()

# 保存模型
trainer.save_model("./fine-tuned-model")
tokenizer.save_pretrained("./fine-tuned-model")
```

## Hub 上传模型

```python
from huggingface_hub import HfApi, login

# 登录
login(token="your_hf_token")

# 上传模型
model.push_to_hub("my-username/my-fine-tuned-model")
tokenizer.push_to_hub("my-username/my-fine-tuned-model")

# 或使用 API
api = HfApi()
api.upload_folder(
    folder_path="./fine-tuned-model",
    repo_id="my-username/my-fine-tuned-model",
    repo_type="model"
)
```

上传时建议包含完整的 Model Card（README.md），描述模型用途、训练数据、评估结果和限制。

## Spaces：快速部署 Demo

Gradio 集成使 Demo 部署极为简单：

```python
# app.py - 直接部署到 HuggingFace Spaces
import gradio as gr
from transformers import pipeline

classifier = pipeline("sentiment-analysis", model="my-fine-tuned-model")

def analyze(text):
    result = classifier(text)[0]
    return {result["label"]: result["score"]}

demo = gr.Interface(
    fn=analyze,
    inputs=gr.Textbox(label="输入文本"),
    outputs=gr.Label(label="情感分析结果"),
    title="情感分析 Demo"
)

demo.launch()
```

在 HuggingFace Spaces 上新建 Space，上传此 app.py 和 requirements.txt，即可获得公网可访问的在线 Demo。

## 实际开发中的应用 / 常见问题

### from_pretrained 下载慢或失败？

配置镜像（如 hf-mirror.com）或使用 `local_files_only=True` 从本地缓存加载。也可提前用 `huggingface-cli download` 手动下载到指定目录。

### 如何选择合适的模型？

根据任务类型筛选（text-classification、token-classification、text-generation 等），关注模型大小与硬件的匹配度。对于中文任务，优先选择专门的中文预训练模型（如 BERT-Chinese、Qwen 系列、ChatGLM 系列）。

### 微调需要多少数据？

取决于任务和模型大小。分类任务通常 1000-10000 条即可获得良好效果。数据质量比数量重要，确保数据标注一致、无偏。

### 如何调试训练过程？

使用 TensorBoard 可视化 `logging_dir` 的日志，监控训练/验证损失曲线。学习率是影响微调效果最大的超参数，建议从小开始（如 2e-5）。

### 模型文件太大如何部署？

使用 ONNX Runtime 或 TensorRT 进行模型优化和压缩。对于大语言模型，使用 vLLM 或 Text Generation Inference 做高性能部署，配合量化技术降低单个实例的显存需求。
