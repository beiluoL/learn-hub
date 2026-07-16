---
question: RAG 系统中如何进行文档分块（Chunking）？有哪些策略和最佳实践？
category: ai
difficulty: middle
tags: "RAG, Chunking, 分块策略, 检索"
order: 37
---

文档分块是 RAG 系统检索质量的决定性因素之一。分块策略直接决定了检索到的上下文是否能覆盖正确答案所需的完整信息——块太大则噪声多、超出 LLM 上下文窗口；块太小则语义碎片化、丢失关键关联。

## 为什么分块如此重要

RAG 流程中存在三个硬约束，使得分块成为不可绕开的环节:

1. **Embedding 模型的输入长度限制**: 主流 Embedding 模型（如 text-embedding-3-small）的 max_tokens 通常为 8191，但实际有效编码窗口可能更小。
2. **LLM 的上下文窗口**: 即使 GPT-4-turbo 有 128K 窗口，检索到的 chunks 总长度也必须控制在合理范围，否则成本飙升且注意力稀释。
3. **语义粒度匹配**: 用户的 query 往往是某个具体问题，需要精确匹配文档中的相关段落。过大或过小的块都会导致向量相似度计算失真。

核心矛盾在于: 我们希望块足够小以精确匹配 query，又希望块足够大以保留完整语义上下文。这就是所有分块策略试图平衡的点。

## 主流分块策略对比

### 1. 固定大小分块（Fixed-size Chunking）

最朴素的方式: 按固定字符数或 token 数切分。

```python
def fixed_size_chunk(text: str, chunk_size: int = 500, overlap: int = 50):
    chunks = []
    start = 0
    while start < len(text):
        end = start + chunk_size
        chunks.append(text[start:end])
        start = end - overlap  # 重叠窗口
    return chunks
```

**优点**: 实现简单，计算成本低。
**缺点**: 可能在句子中间切断，破坏语义完整性。对于结构化内容（表格、代码）尤其糟糕。

### 2. 递归字符分块（Recursive Character Text Splitter）

LangChain 中最推荐的方式: 按优先级递减的分隔符列表递归切分，确保尽可能在自然边界断开。

```python
from langchain.text_splitter import RecursiveCharacterTextSplitter

splitter = RecursiveCharacterTextSplitter(
    chunk_size=500,        # 目标块大小（字符数）
    chunk_overlap=50,      # 块间重叠
    separators=["\n\n", "\n", "。", ".", " ", ""],  # 分隔符优先级
    length_function=len,
)
chunks = splitter.split_text(document)
```

**分隔符优先级**的设计思路: 优先在段落边界（`\n\n`）断开，其次在换行（`\n`），再次在句号，最后才按空格或字符切分。这保证了块尽量在自然语义边界结束。

### 3. 语义分块（Semantic Chunking）

利用 Embedding 模型计算相邻句子的语义相似度，当相似度骤降时切分。

```python
from langchain_experimental.text_splitter import SemanticChunker
from langchain_openai import OpenAIEmbeddings

splitter = SemanticChunker(
    embeddings=OpenAIEmbeddings(),
    breakpoint_threshold_type="percentile",  # 断点策略
    breakpoint_threshold_amount=90,          # 90分位阈值
)
chunks = splitter.create_documents([text])
```

**核心思路**: 计算相邻段落的余弦相似度，当某处的相似度显著低于整体分布的某个百分位时，认为发生了主题切换，在此切分。

**优点**: 语义连贯性最好。
**缺点**: 需要额外的 Embedding 计算成本；依赖 Embedding 模型质量。

### 4. 句子级分块 + 上下文窗口

以句子为单位分块，但保留前后 N 句作为上下文。

```python
import nltk

def sentence_chunk_with_context(text: str, sentences_per_chunk: int = 5, context: int = 2):
    sentences = nltk.sent_tokenize(text)
    chunks = []
    for i in range(0, len(sentences), sentences_per_chunk):
        start = max(0, i - context)
        end = min(len(sentences), i + sentences_per_chunk + context)
        chunks.append(" ".join(sentences[start:end]))
    return chunks
```

## 特殊文档类型的分块

### Markdown / 代码文档

利用 Markdown 的结构信息（`#` / `##` / `###` 标题层级）进行分块，将同一标题段落合并:

```python
from langchain.text_splitter import MarkdownHeaderTextSplitter

headers_to_split_on = [
    ("#", "h1"),
    ("##", "h2"),
    ("###", "h3"),
]
splitter = MarkdownHeaderTextSplitter(headers_to_split_on=headers_to_split_on)
chunks = splitter.split_text(markdown_content)
# 每个 chunk 的 metadata 携带当前标题层级信息
```

检索时可以利用 metadata 中的标题信息做过滤或加权，极大提升结构化文档的检索精度。

### 表格分块

表格在 RAG 中是最棘手的场景之一。固定分块会破坏表格结构。推荐方案:

- **方案 A**: 整表作为一个 chunk，维护时给表格增加自然语言描述摘要。
- **方案 B**: Unstructured.io 库的 `partition_html` / `partition_pdf`，自动识别表格边界并分离。

### 多模态文档（PDF 含图文）

使用 Unstructured 或 LlamaParse 提取时保留页面级结构信息，将同一页的文字和图表关联到同一个 chunk。

## 分块大小的实战调优

| 文档类型 | 推荐块大小 | 重叠 | 说明 |
|---|---|---|---|
| 短 FAQ / 对话 | 128-256 tokens | 16 | 问题简明，小块精确匹配 |
| 技术文档 / Wiki | 512-768 tokens | 64 | 平衡语义完整性与精度 |
| 长篇文章 / 合同 | 1024-1536 tokens | 128 | 段落实体大，需更多上下文 |
| 代码库 | 按函数/类分 | 无 | 使用 AST 解析而非文本切分 |

**经验法则**: 先写一个快速实验脚本，用 3 种不同 chunk_size（256/512/1024）分别做检索，人工评估 top-5 结果的相关性，选择最好的配置。

## 面试追问

- **"Chunk overlap 一定是越大越好吗？"** 不是。过大的 overlap 会导致冗余信息增加，LLM 需要处理的 token 数上升，成本增加。overlap 应刚好覆盖一个完整句子的平均长度。
- **"如何处理跨 chunk 的实体引用？"** 这是 RAG 的固有问题（lost in the middle）。可在检索后做上下文扩展（contextual expansion），检索到 chunk_k 后自动拉取 chunk_{k-1} 和 chunk_{k+1}。
- **"多语言文档怎么分块？"** 推荐使用 token-based 分块而非字符分块，因为中文/日文等语言的字符密度不同。可使用 `tiktoken` 计算 token 数再切分。
- **"检索时 chunks 太少或太多怎么办？"** 太少可以用查询改写（query expansion）生成相近查询；太多可以做重排序（reranking），用 Cross-Encoder 对初检结果精排再截断。
