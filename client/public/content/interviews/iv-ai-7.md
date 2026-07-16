---
question: 如何评估一个 RAG 系统的质量？有哪些评估指标和框架？
category: ai
difficulty: hard
tags: "RAG, 评估, 检索质量, 生成质量, RAGAS"
order: 39
---

RAG 系统的评估需要从检索和生成两个维度进行拆解，每个维度又有自动化指标和人工评估两条线。核心结论: 检索看"找没找到"，生成看"说得对不对"——两者独立又相互制约，任何单指标的优化都不等于系统真的好用。

## 评估为什么困难

传统 NLP 任务（分类/翻译/摘要）有明确的金标准（ground truth），但 RAG 系统面临三重挑战:

1. **没有标准答案**: 同一个问题可以有多个正确回答，BLEU/ROUGE 等 n-gram 匹配指标失效。
2. **错误可能来自任何环节**: 检索没找到（召回漏了）、检索找到了但 LLM 没用到（上下文忽略）、LLM 自己编造（幻觉）。
3. **用户主观性**: 同样的回答对不同用户可能是"好"或"差"。

因此，RAG 评估体系必须覆盖检索→生成→端到端的全链路。

## 检索质量指标

### Recall（召回率）

```
Recall = |检索到的相关文档| / |所有相关文档总数|
```

衡量检索系统"找全了没有"。是 RAG 最重要的指标，因为漏掉的文档 LLM 永远看不到。

### Precision（精确率）

```
Precision = |检索到的相关文档| / |检索到的文档总数|
```

衡量检索结果中"有多少是有用的"。在上下文窗口有限时尤为重要，垃圾文档挤占有用文档的位置。

### NDCG（Normalized Discounted Cumulative Gain）

考虑排序位置的指标——排在前面命中加分更多:

```
DCG_k = Σ(2^rel_i - 1) / log2(i + 1)
NDCG_k = DCG_k / IDCG_k
```

RAG 中检索顺序很重要，因为 LLM 对排在后面的上下文关注度衰减（Lost in the Middle 现象）。

### MRR（Mean Reciprocal Rank）

首个相关文档的排位倒数: `MRR = 1/第一个相关文档的排名`。

### Hit Rate（命中率）

Top-K 结果中至少有一个相关文档的比例。简单直接，适合快速实验。

### 如何构造检索评估数据

用 LLM 生成 QA pairs，每条 pair 标注对应的文档 ID:

```python
# 用 LLM 从文档中生成问题，已知答案是哪些段落
qa_pairs = []
for doc in documents:
    question = llm.generate_question(doc.content)
    qa_pairs.append({
        "question": question,
        "relevant_doc_ids": [doc.id],
    })

# 评估
hits = 0
for pair in qa_pairs:
    retrieved = retriever.search(pair["question"], k=5)
    if any(doc.id in pair["relevant_doc_ids"] for doc in retrieved):
        hits += 1
hit_rate = hits / len(qa_pairs)
```

## 生成质量指标

### Faithfulness（忠实度 / 幻觉检测）

回答中的每句断言是否都能在检索上下文中找到依据:

```
Faithfulness = 可被上下文支撑的断言数 / 总断言数
```

这是 RAG 的生命线——一个检索系统可以说"不知道"，但不能瞎编。RAGAS 框架的做法:

```python
from ragas.metrics import faithfulness

# RAGAS 内部用 LLM 将回答拆成原子断言，逐条比对上下文
result = faithfulness.score(
    question="什么是量化？",
    answer="量化是将模型参数从FP32降低到INT8的过程。",
    contexts=["模型量化是通过减少参数精度来压缩模型的技术。"]
)
# 回答包含 2 个断言:
#   断言1: "量化是将参数从FP32降到INT8"  → 部分可验证
#   断言2: (隐含)'用于降低模型大小的过程' → 可验证
```

### Answer Relevancy（回答相关性）

回答是否紧扣问题，有无跑题:

```python
from ragas.metrics import answer_relevancy

# RAGAS: 根据回答反生成多个问题，计算与原始问题的语义相似度
score = answer_relevancy.score(question, answer)
```

**原理**: 如果回答是相关的，从回答反推出的问题应该与原问题语义相似。这种"反向验证"巧妙地绕过了需要标准答案的限制。

### Context Precision / Recall（上下文精确率/召回率，RAGAS 特有）

- **Context Precision**: 检索到的上下文中，有多少真正对回答有贡献。
- **Context Recall**: 真实答案所需的信息，检索到的上下文中覆盖了多少。

```python
from ragas.metrics import context_precision, context_recall

cp = context_precision.score(question, answer, contexts)
cr = context_recall.score(question, answer, contexts, ground_truth)
```

### 安全 & 毒性指标

- **Toxicity**: 回答是否包含有害内容（用 Perspective API 或 LLM 判断）。
- **Refusal Rate**: 对越界提问是否正确拒绝回答。
- **Sensitive Info Leak**: 是否泄露了不应出现的信息（如系统 prompt、内部数据）。

## RAGAS 框架实战

RAGAS（RAG Assessment）是目前最成熟的 RAG 评估框架:

```python
from ragas import evaluate
from ragas.metrics import (
    faithfulness, answer_relevancy,
    context_precision, context_recall,
)
from datasets import Dataset

eval_dataset = Dataset.from_dict({
    "question": ["什么是 Docker？", "Python 如何管理内存？"],
    "answer": ["Docker 是一个容器化平台...", "Python 使用引用计数和GC..."],
    "contexts": [
        ["Docker 使用容器技术..."],
        ["Python 内存管理基于引用计数..."],
    ],
    "ground_truth": ["Docker 是容器化平台/工具", "Python 使用自动内存管理"],
})

result = evaluate(
    eval_dataset,
    metrics=[faithfulness, answer_relevancy, context_precision, context_recall],
)
print(result)  # {'faithfulness': 0.85, 'answer_relevancy': 0.92, ...}
```

## LLM-as-Judge 的利弊

使用 LLM 评估 LLM 输出已是行业惯例，但需清醒认识其局限:

**优点**:
- 可评估开放性回答，不限于 n-gram 匹配。
- 与人类评分的相关性可达 0.8+（GPT-4 作为 judge 时）。
- 可评估复杂维度（逻辑一致性、创意性）。

**劣势**:
- 自身有偏见（偏好 LLM 生成的回答、位置偏见、长度偏见）。
- 成本高（每条评估需一次 LLM 调用）。
- 对于高精确性要求场景（医疗/法律）不可靠。

**缓解策略**: 用多模型交叉验证（GPT-4 + Claude 分别评分）；随机打乱选项顺序消除位置偏见；对关键场景保留人工校验层。

## 完整评估 Pipeline 设计

```
原始文档 → 生成 QA 测试集 → 检索评估(Recall/NDCG/MRR)
                                    ↓
                              检索到的上下文
                                    ↓
                              生成回答
                                    ↓
                            生成评估(Faithfulness/Relevancy)
                                    ↓
                            汇总报告 + Bad Case 分析
```

**Bad Case 分析**是评估最有价值的产出: 找出系统在哪里出错（检索漏了/检索到了但 LLM 忽略/LLM 编造），针对性优化。

## 面试追问

- **"没有 ground truth 怎么评估检索？"** 用 LLM 判断 retrieved_chunk 与 question 的相关性（auto-relevance labeling），虽然不准但比没有好。更好的方案是用人类标注少量 query 做测试集。
- **"RAGAS 的 faithfulness 计算会不会很贵？"** 会。每条评测需要多次 LLM 调用（拆断言 + 逐条比对）。在生产环境中可以采样评估（评估 10% 的流量）。
- **"评估多久做一次？"** 离线评估在模型/数据变更时必做（CI/CD 中集成）。在线评估（用户 thumbs up/down、LLM-as-Judge 采样）持续监控。两者结合，防止上线后质量退化。
- **"如果你发现 faithfulness 很高但 answer relevancy 很低，哪里出问题了？"** 检索可能返回了与问题弱相关但信息正确的文档——系统在"正确回答错误问题"。需要优化 query 改写或检索策略，确保检索到的内容与用户意图对齐。
