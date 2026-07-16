---
title: LlamaIndex RAG 框架深入
category: ai
level: intermediate
readMinutes: 18
tags: "LlamaIndex, RAG, 索引, 检索"
summary: LlamaIndex RAG 框架深入。
order: 28
prereq: ai/ai-rag
---

## LlamaIndex 核心概念

LlamaIndex（原 GPT Index）是一个专为 RAG（检索增强生成）场景设计的数据框架。它提供了从数据连接到检索再到合成的完整流水线。

LlamaIndex 的核心数据流分为五个阶段：

```
加载 → 解析 → 索引 → 检索 → 合成
Load → Parse → Index → Retrieve → Synthesize
```

每个阶段对应一个核心组件，它们共同构成了 RAG 应用的完整链路。

| 阶段 | 组件 | 职责 |
|------|------|------|
| 加载 | Data Connectors | 从各种数据源读取数据 |
| 解析 | Ingestion Pipeline | 解析与变换 |
| 索引 | Index | 构建检索结构 |
| 检索 | Retriever | 匹配相关文档 |
| 合成 | Response Synthesizer | 结合 LLM 生成答案 |

## Document 与 Node

LlamaIndex 的核心数据抽象：

- **Document**：原始数据容器，包含文本内容和元数据
- **Node**：Document 被切分后的基本检索单元，是最小的检索粒度

```python
from llama_index.core import Document, Settings
from llama_index.core.node_parser import SentenceSplitter

# 创建文档
documents = [
    Document(
        text="LangChain 是一个 LLM 应用开发框架...",
        metadata={"source": "doc/langchain.md", "author": "张三"}
    ),
    Document(
        text="LlamaIndex 专注于 RAG 场景...",
        metadata={"source": "doc/llamaindex.md", "author": "李四"}
    )
]

# 节点解析（文本切分）
parser = SentenceSplitter(
    chunk_size=512,
    chunk_overlap=50
)

nodes = parser.get_nodes_from_documents(documents)
print(f"生成了 {len(nodes)} 个节点")
print(f"第一个节点: {nodes[0].text[:100]}...")
```

## Data Connector：多源数据接入

LlamaIndex 内置了丰富的 Data Connector，支持从各种数据源读取数据：

```python
from llama_index.readers.web import SimpleWebPageReader
from llama_index.readers.file import PDFReader
from llama_index.readers.database import DatabaseReader

# 读取网页
web_reader = SimpleWebPageReader(html_to_text=True)
web_docs = web_reader.load_data([
    "https://example.com/article1",
    "https://example.com/article2"
])

# 读取 PDF
pdf_reader = PDFReader()
pdf_docs = pdf_reader.load_data("./reports/annual-report.pdf")

# 读取数据库
db_reader = DatabaseReader(
    scheme="postgresql",
    host="localhost",
    port="5432",
    user="reader",
    password="***",
    dbname="knowledge_base"
)
query = "SELECT title, content FROM articles WHERE category = 'ai'"
db_docs = db_reader.load_data(query=query)
```

## Ingestion Pipeline

IngestionPipeline 允许自定义数据处理的每个步骤：

```python
from llama_index.core.ingestion import IngestionPipeline
from llama_index.core.extractors import (
    TitleExtractor,
    SummaryExtractor,
    KeywordExtractor
)

pipeline = IngestionPipeline(
    transformations=[
        SentenceSplitter(chunk_size=512, chunk_overlap=50),
        TitleExtractor(llm=llm, nodes=5),
        SummaryExtractor(llm=llm),
        KeywordExtractor(llm=llm, keywords=5),
        embed_model  # 生成 Embedding
    ]
)

processed_nodes = pipeline.run(documents=documents)
```

## 索引类型

LlamaIndex 提供多种索引类型，适配不同检索需求：

### VectorStoreIndex

最常用的索引，将节点向量化存储，支持语义搜索：

```python
from llama_index.core import VectorStoreIndex
from llama_index.embeddings.openai import OpenAIEmbedding

# 配置全局 Embedding 模型
Settings.embed_model = OpenAIEmbedding(
    model="text-embedding-3-small"
)

# 创建索引
index = VectorStoreIndex.from_documents(
    documents,
    show_progress=True
)

# 持久化与加载
index.storage_context.persist("./storage")
```

### SummaryIndex

为每个节点生成摘要，将检索转化为"先选相关摘要再展开详情"的过程。适合结构化文档查询。

### TreeIndex

构建树状结构，每个内部节点概括其子节点内容。从上到下递归选择最相关的子节点继续检索。

### KnowledgeGraphIndex

结合知识图谱，将实体间关系建模为三元组。适合需要多跳推理的场景：

```python
from llama_index.core import KnowledgeGraphIndex
from llama_index.graph_stores.nebula import NebulaGraphStore

graph_store = NebulaGraphStore(
    space_name="knowledge",
    edge_types=["related_to", "depends_on"],
    rel_prop_names=["weight"],
    tags=["entity"]
)

kg_index = KnowledgeGraphIndex.from_documents(
    documents,
    kg_triplet_extract_fn=triplet_extractor,
    graph_store=graph_store,
    max_triplets_per_chunk=3
)
```

## QueryEngine 与 ChatEngine

### QueryEngine

适用于单轮问答场景：

```python
# 基础查询引擎
query_engine = index.as_query_engine(
    similarity_top_k=5,
    response_mode="compact"  # 响应模式
)

response = query_engine.query("LlamaIndex 和 LangChain 有什么区别？")
print(response)

# 带元数据过滤
from llama_index.core.vector_stores import MetadataFilters, ExactMatchFilter

filters = MetadataFilters(
    filters=[ExactMatchFilter(key="category", value="ai")]
)

filtered_engine = index.as_query_engine(
    similarity_top_k=5,
    filters=filters
)
```

**响应模式说明**：
- `refine`：逐文档精炼答案
- `compact`：拼接上下文后一次生成（推荐）
- `tree_summarize`：递归树状总结

### ChatEngine

支持多轮对话，跟踪对话上下文：

```python
chat_engine = index.as_chat_engine(
    chat_mode="condense_plus_context",
    verbose=True
)

response = chat_engine.chat("什么是 RAG？")
print(response)

# 追问
response = chat_engine.chat("它的主要优势是什么？")
print(response)

# 查看对话历史
for msg in chat_engine.chat_history:
    print(f"{msg.role}: {msg.content[:50]}...")
```

## 高级 RAG 技术

### HyDE

生成假设性文档后检索，提升零相关性场景的召回率：

```python
from llama_index.core.indices.query.query_transform import HyDEQueryTransform

hyde_transform = HyDEQueryTransform(
    llm=llm,
    include_original=True  # 保留原始查询
)

query_engine = index.as_query_engine(
    query_transform=hyde_transform
)
```

### 递归检索

先检索大块文档再递归检索更细粒度的内容，适合长文档：

```python
from llama_index.core.indices.vector_store.retrievers import (
    VectorIndexAutoRetriever
)

retriever = VectorIndexAutoRetriever(
    index=index,
    vector_store_info=vector_store_info,
    similarity_top_k=10,
    empty_query_top_k=10,
    verbose=True
)
```

## 与 LangChain 对比

| 维度 | LlamaIndex | LangChain |
|------|-----------|-----------|
| 专注领域 | RAG 和数据管理 | 通用 LLM 应用 |
| 数据连接 | 丰富且原生 | 通过 Community 模块 |
| 索引结构 | 多类型索引 | 以 VectorStore 为主 |
| Agent | 基础支持 | 强大的 Agent 体系 |
| 学习曲线 | 较平缓 | 较陡峭 |

两者并非互斥，可以结合使用。例如用 LlamaIndex 构建检索管道，用 LangChain 的 Agent 编排决策逻辑。

## 实际开发中的应用 / 常见问题

### LlamaIndex 和 LangChain 怎么选？

专注数据管道和检索用 LlamaIndex；需要复杂的 Agent 编排、多工具协作、对话记忆等用 LangChain。也可以组合使用：LlamaIndex 做 Retrieval、LangChain 做 Orchestration。

### 检索效果不好怎么办？

系统排查：检查 chunk 策略是否合适 → 检查 Embedding 模型与文档语言的匹配度 → 增加 reranker（如 Cohere Rerank 或 bge-reranker）→ 引入 Query Transformation（如 HyDE、查询改写）。

### 如何处理更新频繁的知识库？

使用增量索引 + Refresh 机制。LlamaIndex 支持对已有索引进行节点级别的增删改，避免全量重建。对于大型知识库，考虑使用支持 upsert 的向量数据库（Pinecone、Milvus）。

### 节点粒度如何选择？

通用建议 256-1024 tokens。代码场景按函数或类粒度，法律文档按条款粒度。可以通过 A/B 测试不同 chunk 策略对最终回答质量的影响来确定最佳粒度。
