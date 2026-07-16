---
title: 向量数据库选型与实战
category: ai
level: intermediate
readMinutes: 18
tags: "向量数据库, Pinecone, Milvus, Chroma"
summary: 向量数据库选型与实战对比。
order: 24
prereq: ai/ai-vector
---

## 向量数据库核心原理

向量数据库专门存储和检索高维向量（Embedding）。与传统数据库基于精确匹配不同，向量数据库基于相似度检索，核心问题是在海量向量中快速找到与查询向量最相似的 Top-K 个。

由于精确最近邻搜索（暴力搜索）的复杂度为 O(N·d)，当数据量达到百万级以上时不可行。实际使用近似最近邻（ANN）算法，在精度和速度之间寻求权衡。

## 索引算法

### HNSW

分层可导航小世界图（Hierarchical Navigable Small World）是目前最流行的索引算法。它构建多层图结构：上层较稀疏用于跳跃导航，底层密集用于精确搜索。

```python
# ChromaDB 中的 HNSW 参数配置
import chromadb

client = chromadb.PersistentClient(path="./chroma_db")

collection = client.create_collection(
    name="docs",
    metadata={
        "hnsw:space": "cosine",          # 距离度量
        "hnsw:construction_ef": 100,      # 构建时搜索范围
        "hnsw:M": 16,                     # 每层最大连接数
        "hnsw:search_ef": 100,            # 查询时搜索范围
    }
)
```

**参数说明**：M 越大，召回率越高但内存占用增加；ef 越大，搜索越精确但速度下降。

### IVF

倒排文件索引（Inverted File Index）先对向量空间进行聚类，检索时只搜索最近的几个聚类中心，显著减少搜索范围。

### LSH

局部敏感哈希（Locality Sensitive Hashing）通过哈希函数将相似向量映射到同一"桶"中，检索时只比较同一桶内的向量。速度快但召回率偏低。

## ChromaDB：轻量本地方案

ChromaDB 是最简单的向量数据库，Python 原生，适合原型开发和中小规模应用。

```python
import chromadb
from chromadb.utils import embedding_functions

# 使用 OpenAI Embedding
openai_ef = embedding_functions.OpenAIEmbeddingFunction(
    api_key="your-api-key",
    model_name="text-embedding-3-small"
)

client = chromadb.PersistentClient(path="./chroma_db")
collection = client.get_or_create_collection(
    name="knowledge_base",
    embedding_function=openai_ef
)

# 添加文档
documents = [
    "LangChain 是一个用于构建 LLM 应用的框架",
    "向量数据库用于存储和检索 Embedding 向量",
    "Transformer 架构是 LLM 的基础",
]
ids = ["doc_1", "doc_2", "doc_3"]

collection.add(
    documents=documents,
    ids=ids
)

# 语义搜索
results = collection.query(
    query_texts=["什么是大模型的基础架构？"],
    n_results=2
)

for i, (doc_id, doc, distance) in enumerate(zip(
    results["ids"][0],
    results["documents"][0],
    results["distances"][0]
)):
    print(f"{i+1}. [{doc_id}] 相似度: {1-distance:.3f}\n   {doc}")
```

## Pinecone：托管 SaaS

Pinecone 是完全托管的向量数据库，无需管理基础设施。支持 Serverless 索引，按用量计费，适合团队快速上线。

```python
import pinecone
from pinecone import Pinecone, ServerlessSpec

pc = Pinecone(api_key="your-api-key")

# 创建 Serverless 索引
pc.create_index(
    name="knowledge-base",
    dimension=1536,  # OpenAI embedding 维度
    metric="cosine",
    spec=ServerlessSpec(
        cloud="aws",
        region="us-east-1"
    )
)

index = pc.Index("knowledge-base")

# 批量插入向量
vectors = [
    ("doc_1", [0.1, 0.2, ...], {"text": "文档内容"}),
    ("doc_2", [0.3, 0.4, ...], {"text": "另一个文档"}),
]
index.upsert(vectors=vectors)

# 搜索
results = index.query(
    vector=query_embedding,
    top_k=5,
    include_metadata=True,
    filter={"category": "ai"}
)
```

## Milvus：开源高性能

Milvus 是 CNCF 毕业项目，主打高性能和弹性伸缩。支持十亿级向量检索，提供丰富的索引类型和混合查询能力。

```python
from pymilvus import (
    connections, Collection, FieldSchema,
    CollectionSchema, DataType
)

connections.connect(host="localhost", port="19530")

# 定义 Schema
fields = [
    FieldSchema(name="id", dtype=DataType.INT64, is_primary=True, auto_id=True),
    FieldSchema(name="text", dtype=DataType.VARCHAR, max_length=512),
    FieldSchema(name="embedding", dtype=DataType.FLOAT_VECTOR, dim=768),
]

schema = CollectionSchema(fields, description="知识库集合")
collection = Collection(name="knowledge", schema=schema)

# 创建索引
index_params = {
    "index_type": "IVF_FLAT",
    "metric_type": "COSINE",
    "params": {"nlist": 1024}
}
collection.create_index(
    field_name="embedding",
    index_params=index_params
)

# 混合搜索（向量相似度 + 标量过滤）
collection.load()

search_params = {"metric_type": "COSINE", "params": {"nprobe": 16}}
results = collection.search(
    data=[query_embedding],
    anns_field="embedding",
    param=search_params,
    limit=5,
    expr='category == "ai"',  # 标量过滤
    output_fields=["text", "category"]
)
```

## 方案对比

| 维度 | ChromaDB | Pinecone | Milvus | Qdrant | Weaviate |
|------|----------|----------|--------|--------|----------|
| 部署方式 | 嵌入式/本地 | SaaS | 自托管/K8s | 自托管/云 | 自托管/云 |
| 数据规模 | 百万级 | 十亿级 | 十亿级 | 十亿级 | 十亿级 |
| 开源 | 是 | 否 | 是 | 是 | 是 |
| 标量过滤 | 基础 | 高级 | 高级 | 高级 | GraphQL |
| 学习成本 | 低 | 低 | 中高 | 中 | 中 |
| 适用阶段 | 原型开发 | 快速上线 | 生产大规模 | 中型生产 | 复杂查询 |

## 与 LangChain 集成

```python
from langchain.vectorstores import Chroma
from langchain.embeddings import OpenAIEmbeddings

embeddings = OpenAIEmbeddings(model="text-embedding-3-small")

# 从文档直接创建向量存储
from langchain.document_loaders import TextLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter

loader = TextLoader("./docs/article.txt")
documents = loader.load()

text_splitter = RecursiveCharacterTextSplitter(
    chunk_size=500,
    chunk_overlap=50
)
chunks = text_splitter.split_documents(documents)

vector_store = Chroma.from_documents(
    documents=chunks,
    embedding=embeddings,
    persist_directory="./chroma_store"
)

# 创建 Retriever
retriever = vector_store.as_retriever(
    search_type="mmr",  # 最大边际相关性，增加结果多样性
    search_kwargs={"k": 5, "fetch_k": 20}
)
```

## 实际开发中的应用 / 常见问题

### 如何选择向量数据库？

- **原型阶段**（数据量 < 10 万）：ChromaDB，零配置
- **中小规模生产**（数据量 < 100 万）：Qdrant，部署简单
- **大规模生产**（数据量 > 100 万）：Milvus，性能最优
- **不想管理基础设施**：Pinecone，全托管

### Chunk 大小怎么设？

Chunk 大小直接影响检索质量。过小可能丢失上下文，过大可能引入噪声。常见选择：
- 通用文本：500-1000 tokens
- 代码文件：按函数或类切分
- 对话记录：按轮次切分

建议保持 10%-20% 的 Overlap 以避免遗漏跨块信息。

### 什么时候需要重新构建索引？

当数据量增长超过初始索引容量的 2-3 倍时，HNSW 的图结构质量下降，召回率可能降低。IVF 索引需要定期重新聚类以适应数据分布变化。

### 混合搜索的最佳实践

纯向量搜索可能丢失精确匹配的场景。混合搜索（向量相似度 + BM25 关键词匹配）能兼顾语义相似度和关键词精确度，Weaviate 和 Milvus 原生支持这种模式。
