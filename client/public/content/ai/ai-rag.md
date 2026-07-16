---
title: RAG：检索增强生成
category: ai
level: intermediate
readMinutes: 18
tags: "RAG, 向量库, 检索, Embedding"
summary: "用私有知识 + 检索喂给 LLM，解决\"幻觉\"与知识时效问题。"
order: 2
---

## 一、RAG 是什么

Retrieval-Augmented Generation：先把用户问题检索到的相关文档片段拼进提示词，再让 LLM 基于这些证据作答。比单纯微调更适合频繁更新的私有知识。

## 二、典型流程

1.  **索引**：文档切分（chunk）→ Embedding 向量化 → 存入向量库
2.  **检索**：query 向量化 → 向量相似度（cosine）召回 Top-K
3.  **生成**：把召回片段 + 问题拼成 Prompt 交给 LLM

```
# 伪代码
chunks = split(doc)
vectors = embed(chunks)
store.upsert(vectors)
hits = store.search(embed(query), top_k=5)
answer = llm(prompt = hits + question)
```

## 三、关键优化点

-   切分策略：按语义/标题切，避免截断；重叠（overlap）保留上下文
-   混合检索：向量 + 关键词（BM25）融合，召回更稳
-   重排（Rerank）：用交叉编码器对候选再排序
-   引用溯源：输出附带来源片段，便于核查
