---
title: 提示工程进阶
category: ai
level: intermediate
readMinutes: 18
tags: "提示工程, CoT, Few-shot, 结构化输出"
summary: 提示工程进阶：思维链、少样本与结构化输出。
order: 25
prereq: ai/ai-prompt
---

## 从基础到进阶

提示工程（Prompt Engineering）是设计和优化输入提示以引导 LLM 产生预期输出的实践。随着模型能力的增强，提示工程从简单的指令书写发展为系统性的方法论。

核心思想：**模型的能力上限由提示的质量决定**，精心设计的提示可以将模型的潜在能力充分释放。

## Zero-shot 与 Few-shot

### Zero-shot 提示

不给任何示例，直接描述任务：

```
将以下句子翻译成英文：
"今天天气真好。"
```

### Few-shot 提示

提供 2-5 个示例让模型理解任务格式和期望：

```
将中文句子翻译成英文：

中文：猫在沙发上睡觉。
英文：The cat is sleeping on the sofa.

中文：我昨天去了图书馆。
英文：I went to the library yesterday.

中文：你能帮我一个忙吗？
英文：
```

**实践注意**：示例质量比数量更重要。精心挑选 3 个高质量示例通常优于 10 个普通示例。

## Chain of Thought (CoT)

思维链提示引导模型在给出最终答案前，逐步展示推理过程。Wei 等人（2022）发现，仅通过在提示中加入"Let's think step by step"就能显著提升推理任务准确率。

### Few-shot CoT

提供带推理过程的示例：

```
问题：一个农场有 12 只鸡和 8 只兔子，一共有多少条腿？
思考：鸡有 2 条腿，所以 12 只鸡 = 12×2 = 24 条腿。
兔子有 4 条腿，所以 8 只兔子 = 8×4 = 32 条腿。
总共 = 24 + 32 = 56 条腿。
答案：56

问题：小明买了 3 本书，每本 25 元，又买了 2 支笔，每支 8 元。他给了 100 元，能找回多少？
思考：
```

### Zero-shot CoT

最简单的方式，在问题末尾添加触发词：

```
问题：一个水池有 A、B 两个进水管，A 单独注满需 4 小时，B 单独注满需 6 小时。两管同时打开，多久能注满？
让我们一步步思考。
```

Zero-shot CoT 不需要示例，适用性更广。

## Self-Consistency：多次采样投票

Self-Consistency 是 CoT 的增强：对同一问题生成多条推理路径，然后取最一致的答案。

```python
def self_consistency_reasoning(llm, question, n_samples=5):
    """
    多次采样 + 投票
    """
    prompt = f"问题：{question}\n让我们一步步思考："
    answers = []

    for _ in range(n_samples):
        response = llm.generate(
            prompt, temperature=0.7  # 非零温度确保多样性
        )
        answer = extract_final_answer(response)
        answers.append(answer)

    # 取出现次数最多的答案
    from collections import Counter
    return Counter(answers).most_common(1)[0][0]
```

**关键注意**：Self-Consistency 依赖推理路径的多样性，temperature 必须 > 0。采样次数通常取 5-21 之间的奇数。

## Tree of Thought：分支探索

Tree of Thought（ToT）将推理过程建模为树结构，每个节点代表一个中间思考状态。模型在每个节点生成多个候选思路，评估后选择最有希望的路径继续探索：

```
问题分解
├── 思路 A ──→ 评估 ──→ 继续
├── 思路 B ──→ 评估 ──→ 剪枝
└── 思路 C ──→ 评估 ──→ 继续
```

ToT 适用于需要规划的任务，如数学证明、创意写作、策略游戏。

## ReAct：推理 + 行动

ReAct（Reasoning + Acting）将推理与外部工具调用交替进行：

```
任务：查找 2024 年诺贝尔物理学奖得主的出生年份

思考 1：我需要搜索 2024 年诺贝尔物理学奖得主
行动 1：搜索"2024 年诺贝尔物理学奖"
观察 1：获奖者是 John Hopfield 和 Geoffrey Hinton

思考 2：现在我知道了获奖者，需要分别查找他们的出生年份
行动 2：搜索"John Hopfield 出生年份"
观察 2：John Hopfield 出生于 1933 年

思考 3：现在查找 Hinton
行动 3：搜索"Geoffrey Hinton 出生年份"
观察 3：Geoffrey Hinton 出生于 1947 年

最终答案：John Hopfield (1933) 和 Geoffrey Hinton (1947)
```

## 结构化输出

### JSON Mode

强制模型输出 JSON 格式：

```python
import openai

response = openai.chat.completions.create(
    model="gpt-4o",
    messages=[{
        "role": "system",
        "content": "提取文本中的实体，以 JSON 格式返回"
    }, {
        "role": "user",
        "content": "乔布斯于 1976 年在加州创立了苹果公司"
    }],
    response_format={"type": "json_object"}
)
```

### Function Calling / Tool Use

```python
# 定义工具函数 Schema
tools = [{
    "type": "function",
    "function": {
        "name": "get_weather",
        "description": "获取指定城市的天气信息",
        "parameters": {
            "type": "object",
            "properties": {
                "city": {
                    "type": "string",
                    "description": "城市名称，如 Beijing"
                },
                "unit": {
                    "type": "string",
                    "enum": ["celsius", "fahrenheit"]
                }
            },
            "required": ["city"]
        }
    }
}]

response = openai.chat.completions.create(
    model="gpt-4o",
    messages=[{"role": "user", "content": "北京今天天气怎么样？"}],
    tools=tools,
    tool_choice="auto"
)
```

### Pydantic 结构化输出

```python
from pydantic import BaseModel
from typing import Literal

class SentimentResult(BaseModel):
    sentiment: Literal["正面", "中性", "负面"]
    confidence: float
    key_phrases: list[str]
    summary: str

# 结合 LangChain 的 PydanticOutputParser
from langchain.output_parsers import PydanticOutputParser

parser = PydanticOutputParser(pydantic_object=SentimentResult)

system_prompt = f"""
你是一个情感分析专家。分析用户文本并返回结构化结果。

{parser.get_format_instructions()}
"""
```

## 系统提示 vs 用户提示

GPT/Claude 等现代模型支持分离系统提示和用户提示：

- **系统提示**：设定角色、规则、行为约束，优先级高于用户提示
- **用户提示**：具体任务、问题、输入数据

最佳实践是使用系统提示定义"你是谁、你该怎么做"，用户提示提供"你要处理什么"。

## Prompt 注入与防护

Prompt 注入是 LLM 应用的主要安全威胁之一：攻击者通过构造恶意输入覆盖或绕过系统指令。

### 防御策略

1. **输入隔离**：使用明确的分隔符标记用户输入区域
2. **权限控制**：敏感操作需人工确认（Human-in-the-loop）
3. **二次验证**：用独立模型检查输出是否符合预期
4. **最小权限原则**：工具调用只授予完成任务必需的最小权限

## 实际开发中的应用 / 常见问题

### 如何处理模型不遵循 JSON 格式？

即使开启 JSON Mode，模型偶尔也可能输出非标准 JSON。在生产环境中始终添加 try/except 和重试逻辑。对于格式要求严格的场景，建议使用 Function Calling 或 Pydantic 解析器。

### Cot 什么时候失效？

CoT 在简单任务上可能增加不必要的 token 消耗，在需要外部知识的任务上（如事实性问答）效果有限。CoT 最适合多步推理任务。

### 提示模板应该硬编码还是动态构建？

对于固定的业务场景，硬编码提示模板更可控。对于需要灵活组合的复杂场景，使用 LangChain 的 PromptTemplate 或类似框架。始终记录提示版本号，便于 A/B 测试和回滚。

### 如何评估提示质量？

建立标准化的评估集，使用自动化指标（准确率、格式合规率）和人工评审（质量评分）。对于关键应用，建议做 Prompt A/B 测试，对比不同版本的性能差异。
