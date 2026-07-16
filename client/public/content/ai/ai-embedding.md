---
title: 嵌入技术原理与语义搜索
category: ai
level: intermediate
readMinutes: 16
tags: "Embedding, 语义搜索, 嵌入, 向量化"
summary: 嵌入技术原理与语义搜索实战。
order: 29
prereq: ai/ai-vector
---

## Embedding 是什么

Embedding（嵌入）是将离散的文本、图像或其他非结构化数据映射到连续向量空间的技术。在这个向量空间中，语义相似的文本在几何上也相近。

例如，"猫"和"猫咪"的 Embedding 向量距离很近，而"猫"和"汽车"的距离很远。这种性质使 Embedding 成为语义搜索、聚类、推荐系统的基础。

Embedding 的核心特性：

- **语义捕获**：向量编码了文本的含义，而非表面文字
- **相似度计算**：通过向量距离快速衡量文本间的语义关系
- **降维表示**：将高维稀疏的 one-hot 表示压缩为低维密集向量

```python
import numpy as np

def cosine_similarity(a, b):
    """余弦相似度"""
    return np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b))

def euclidean_distance(a, b):
    """欧氏距离"""
    return np.linalg.norm(a - b)

def dot_product(a, b):
    """点积（向量已归一化时等价于余弦相似度）"""
    return np.dot(a, b)
```

## 常用 Embedding 模型

| 模型 | 维度 | 提供方 | 特点 |
|------|------|--------|------|
| text-embedding-3-small | 512/1536 | OpenAI | 性价比高，支持维度缩减 |
| text-embedding-3-large | 256-3072 | OpenAI | 最高质量，MTEB 排行榜前列 |
| bge-large-zh-v1.5 | 1024 | BAAI | 中文表现优秀 |
| m3e-base | 768 | Moka AI | 轻量中文，开源 |
| nomic-embed-text | 768 | Nomic AI | 开源，支持长文本 |
| jina-embeddings-v3 | 1024 | Jina AI | 支持 8192 token 输入 |

### 选择模型的考量

维度越高通常精度越好，但检索速度和存储成本也越高。768-1536 维是实用的平衡点。对于中文场景，优先选择中文优化的模型（BGE、M3E）。

```python
# 使用 OpenAI Embedding
from openai import OpenAI

client = OpenAI()

def get_openai_embedding(text: str, model="text-embedding-3-small"):
    response = client.embeddings.create(
        model=model,
        input=text,
        dimensions=512  # 可选：缩减维度
    )
    return response.data[0].embedding

text = "机器学习是人工智能的重要分支"
embedding = get_openai_embedding(text)
print(f"向量维度: {len(embedding)}")
print(f"前 5 个值: {embedding[:5]}")
```

### 本地 Embedding 模型

使用 Sentence Transformers 加载本地模型：

```python
from sentence_transformers import SentenceTransformer

# 加载 BGE 中文模型
model = SentenceTransformer("BAAI/bge-large-zh-v1.5")

# 批量编码（比逐条调用快 10x+）
texts = [
    "人工智能正在改变世界",
    "机器学习是 AI 的核心技术",
    "今天天气真不错",
    "深度学习需要大量数据和算力"
]

embeddings = model.encode(
    texts,
    normalize_embeddings=True,  # L2 归一化后点积 = 余弦相似度
    show_progress_bar=True
)

print(f"嵌入矩阵形状: {embeddings.shape}")
# 计算相似度
similarity_ai_ml = np.dot(embeddings[0], embeddings[1])
similarity_ai_weather = np.dot(embeddings[0], embeddings[2])
print(f"AI 与 ML 相似度: {similarity_ai_ml:.4f}")
print(f"AI 与天气相似度: {similarity_ai_weather:.4f}")
```

## 语义搜索管道

一个完整的语义搜索系统包含以下步骤：

```python
import chromadb

class SemanticSearchEngine:
    def __init__(self, model_name="BAAI/bge-large-zh-v1.5"):
        self.model = SentenceTransformer(model_name)
        self.chroma_client = chromadb.PersistentClient(path="./search_db")
        self.collection = self.chroma_client.get_or_create_collection(
            name="documents",
            metadata={"hnsw:space": "cosine"}
        )

    def index_documents(self, documents: list[dict]):
        """索引文档"""
        ids = []
        texts = []
        metadatas = []

        for i, doc in enumerate(documents):
            ids.append(f"doc_{i}")
            texts.append(doc["content"])
            metadatas.append({
                "title": doc.get("title", ""),
                "category": doc.get("category", ""),
                "url": doc.get("url", "")
            })

        embeddings = self.model.encode(texts, normalize_embeddings=True)
        self.collection.add(
            ids=ids,
            embeddings=embeddings.tolist(),
            documents=texts,
            metadatas=metadatas
        )

    def search(self, query: str, top_k: int = 5):
        """语义搜索"""
        query_embedding = self.model.encode(
            [query],
            normalize_embeddings=True
        )

        results = self.collection.query(
            query_embeddings=query_embedding.tolist(),
            n_results=top_k
        )

        formatted = []
        for i, (doc_id, doc_text, distance, metadata) in enumerate(zip(
            results["ids"][0],
            results["documents"][0],
            results["distances"][0],
            results["metadatas"][0]
        )):
            formatted.append({
                "rank": i + 1,
                "id": doc_id,
                "text": doc_text[:200],
                "similarity": 1 - distance,
                "metadata": metadata
            })

        return formatted
```

## 二维可视化：t-SNE 与 UMAP

高维向量无法直接观察，降维可视化有助于理解 Embedding 空间结构：

```python
from sklearn.manifold import TSNE
import umap
import matplotlib.pyplot as plt

# 准备数据：30 条文本，分为 3 个类别
texts = [...]  # 你的文本列表
labels = [...]  # 对应的类别标签

embeddings = model.encode(texts)

# t-SNE 降维
tsne_embeddings = TSNE(
    n_components=2,
    random_state=42,
    perplexity=5
).fit_transform(embeddings)

# UMAP 降维（通常比 t-SNE 更快）
umap_embeddings = umap.UMAP(
    n_components=2,
    random_state=42
).fit_transform(embeddings)

# 可视化
fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(14, 5))

for label in set(labels):
    mask = [l == label for l in labels]
    ax1.scatter(
        tsne_embeddings[mask, 0],
        tsne_embeddings[mask, 1],
        label=label, alpha=0.7
    )
    ax2.scatter(
        umap_embeddings[mask, 0],
        umap_embeddings[mask, 1],
        label=label, alpha=0.7
    )

ax1.set_title("t-SNE 可视化")
ax2.set_title("UMAP 可视化")
ax1.legend()
plt.show()
```

## Fine-tune Embedding 模型

当通用 Embedding 模型在特定领域表现不佳时，可以进行微调：

```python
from sentence_transformers import (
    SentenceTransformer,
    InputExample,
    losses
)
from torch.utils.data import DataLoader

# 准备训练数据：正例对（语义相近）+ 负例对
train_examples = [
    InputExample(
        texts=["什么是机器学习", "机器学习入门教程"],
        label=1.0  # 正例：语义相近
    ),
    InputExample(
        texts=["机器学习", "今天吃什么"],
        label=0.0  # 负例：语义无关
    ),
    # ...更多样本
]

train_dataloader = DataLoader(
    train_examples,
    shuffle=True,
    batch_size=16
)

model = SentenceTransformer("BAAI/bge-large-zh-v1.5")
train_loss = losses.CosineSimilarityLoss(model)

# 微调
model.fit(
    train_objectives=[(train_dataloader, train_loss)],
    epochs=3,
    warmup_steps=100,
    output_path="./fine-tuned-embedding"
)
```

**微调注意**：少量高质量的正例对（几百对）比大量嘈杂数据更有效。微调后务必在验证集上评估 Recall@K。

## Embedding 维度与速度权衡

维度对性能和成本有直接影响：

| 维度 | 检索速度 | 存储成本 | 精度 | 适用场景 |
|------|---------|---------|------|---------|
| 256 | 极快 | 低 | 可接受 | 粗检索、候选生成 |
| 512 | 快 | 中 | 良好 | 通用场景 |
| 768 | 中 | 中 | 好 | 精度优先 |
| 1536 | 慢 | 高 | 最优 | 高精度要求 |
| 3072 | 很慢 | 很高 | 最优 | 极高精度 |

OpenAI 的 text-embedding-3 模型支持通过 `dimensions` 参数动态缩减维度：保留 512 维比完整 3072 维在相同存储成本下获得更好的综合表现。

## 实际开发中的应用 / 常见问题

### 如何选择 Embedding 模型？

优先考虑：语言匹配 > 任务匹配 > 模型大小。中文场景用 BGE/M3E，英文场景用 text-embedding-3 或 nomic-embed-text。在目标数据上做小规模评测（Recall@5/10）是选择模型的最可靠方法。

### 归一化是否必要？

使用余弦相似度时强烈建议对向量做 L2 归一化。归一化后点积等价于余弦相似度，且向量检索库（如 Faiss）对归一化向量的内积搜索有性能优化。

### Embedding 的维度陷阱

高维向量的距离会趋于集中（维度诅咒），导致所有距离变得相似。这就是为什么即使 3072 维理论上更精确，实践中 512 维有时反而表现更好。

### 如何处理超长文本？

对超长文本（超过模型最大长度）进行智能分块：保留标题/摘要作为全局表示，对正文按语义段落分块并分别编码，检索时选择最相关的 Top-K 个块。
