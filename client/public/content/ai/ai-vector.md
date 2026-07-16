---
title: 向量数据库与 Embedding
category: ai
level: intermediate
readMinutes: 15
tags: "向量库, Embedding, 相似度, 检索"
summary: 理解文本向量化与近似最近邻检索，支撑 RAG/Agent 记忆。
order: 4
---

## 一、Embedding 是什么

将文本映射为稠密向量（如 1536 维），语义相近的文本向量距离更近。模型如 OpenAI text-embedding、BGE、m3e 等。

## 二、向量检索

把查询向量与库中向量比较相似度（常用余弦距离），取 Top-K。大规模下用**近似最近邻（ANN）**算法加速：

| 算法 | 特点 |
| --- | --- |
| HNSW | 图索引，召回高、内存大 |
| IVF | 倒排簇，快但需调 nprobe |
| PQ | 量化压缩，省内存 |

## 三、常见向量库

-   **Milvus / Qdrant / Weaviate**：专用向量数据库，生产级
-   **pgvector**：PostgreSQL 插件，复用现有库
-   **Faiss / Chroma**：轻量/本地原型

```
# Qdrant 示例
client.upsert("docs", points=[PointStruct(id=1, vector=vec, payload={"text": t})])
client.search("docs", query_vector=vec, limit=5)
```
