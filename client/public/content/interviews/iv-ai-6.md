---
question: LangChain 的核心组件有哪些？Chain、Agent、Tool 之间是什么关系？
category: ai
difficulty: middle
tags: "LangChain, Chain, Agent, Tool, Memory"
order: 38
---

LangChain 是一个用于构建 LLM 应用的开源框架，其核心设计哲学是将 LLM 应用拆解为可组合的模块。Chain 是固定流程的管道，Agent 是动态决策的调度器，Tool 是 Agent 的能力扩展——三者构成了从简单到复杂的 LLM 应用构建层次。

## LangChain 六大核心组件

### 1. Model I/O（模型交互）

封装与 LLM/ChatModel/Embedding 模型的交互:

- **LLM**: 文本输入→文本输出（如 OpenAI GPT-4）。
- **ChatModel**: 消息列表输入→消息输出（支持 system/user/assistant 角色）。
- **Embedding**: 文本→向量（用于 RAG 的检索）。
- **标准化接口**: 统一的 `.invoke()` / `.stream()` / `.batch()` 调用方式。

### 2. Prompt（提示词管理）

提供 Prompt Template 和 Selector:

```python
from langchain_core.prompts import ChatPromptTemplate, FewShotChatMessagePromptTemplate

# 标准模板
prompt = ChatPromptTemplate.from_messages([
    ("system", "你是一个 {role}，擅长回答 {domain} 问题。"),
    ("user", "{input}")
])

# Few-shot 模板
examples = [
    {"input": "什么是闭包？", "answer": "闭包是..."},
    {"input": "什么是柯里化？", "answer": "柯里化是..."},
]
example_prompt = ChatPromptTemplate.from_messages([
    ("user", "{input}"), ("assistant", "{answer}")
])
few_shot_prompt = FewShotChatMessagePromptTemplate(
    example_prompt=example_prompt, examples=examples,
)
```

### 3. Chain（链式调用）

Chain 将多个组件按固定顺序串联。核心是 "把 LLM 调用与其他组件组合成一个 pipeline":

```python
from langchain_core.output_parsers import StrOutputParser
from langchain_core.runnables import RunnablePassthrough

# LCEL (LangChain Expression Language) 风格链
chain = (
    {"context": retriever, "question": RunnablePassthrough()}
    | prompt
    | llm
    | StrOutputParser()
)

result = chain.invoke("什么是 RAG？")
```

**Chain 的本质**: 固定 DAG（有向无环图）。一旦定义好流程，每一步的输入输出都是确定的。适合明确流程的任务（如 RAG 检索→增强→生成的三步走）。

### 4. Agent（智能体）

Agent 使用 LLM 作为推理引擎，**动态决定**调用哪些 Tool、以什么顺序调用:

```python
from langchain.agents import create_openai_functions_agent, AgentExecutor
from langchain.tools import tool

@tool
def search(query: str) -> str:
    """搜索互联网获取最新信息"""
    return f"搜索结果: 关于 '{query}' 的信息..."

@tool
def calculator(expression: str) -> str:
    """计算数学表达式"""
    return str(eval(expression))

agent = create_openai_functions_agent(llm, [search, calculator], prompt)
executor = AgentExecutor(agent=agent, tools=[search, calculator], verbose=True)

executor.invoke({"input": "2024年诺贝尔物理学奖得主是谁？他的年龄乘以2是多少？"})
```

Agent 的执行流程: 接收输入→LLM 推理→决定调用 Tool→执行 Tool→将结果反馈给 LLM→重复直到得出最终答案或达到 max_iterations。

**Agent 与 Chain 的关键区别**: Chain 的路径是编译时确定的，Agent 的路径是运行时 LLM 推理决定的。Agent 更灵活但更不可控（可能陷入循环、调用错误工具）。

### 5. Tool（工具）

Tool 是 Agent 与外部世界交互的接口，包含两部分:

```python
@tool
def get_weather(city: str) -> str:
    """获取指定城市的天气信息。输入应为中文城市名。"""
    # 调用天气 API
    return f"{city}的天气: 晴，25°C"
```

- **函数定义**: 要执行的实际逻辑（API 调用、数据库查询、文件读写等）。
- **函数描述（docstring）**: LLM 据此判断何时使用该 Tool，描述质量直接影响 Agent 的工具选择准确率。

Tool 的设计原则:
- 描述要精确（"做什么/输入格式/返回值"），因为 LLM 依赖它做决策。
- 单 Tool 做单一职责，不要一个 Tool 同时查询和修改。
- 参数类型明确，使用 Pydantic 定义 schema。

### 6. Memory（记忆管理）

Memory 让 Chain/Agent 能记住历史对话:

```python
from langchain.memory import ConversationBufferWindowMemory

memory = ConversationBufferWindowMemory(k=5, return_messages=True)
# 仅保留最近 5 轮对话，避免 token 数膨胀
```

常见 Memory 类型:
| 类型 | 策略 | 适用场景 |
|---|---|---|
| ConversationBufferMemory | 全量存储 | 短对话 |
| ConversationBufferWindowMemory | 滑动窗口 | 长对话，防止 token 爆炸 |
| ConversationSummaryMemory | LLM 摘要压缩 | 长对话，保留语义 |
| VectorStoreMemory | 向量检索 | 海量历史，按需检索相关片段 |

### 7. Retrieval（检索增强）

连接外部知识库，是 RAG 的核心:

```python
from langchain_community.vectorstores import Chroma
from langchain_openai import OpenAIEmbeddings

vectorstore = Chroma.from_documents(documents, OpenAIEmbeddings())
retriever = vectorstore.as_retriever(search_kwargs={"k": 4})
```

## Chain vs Agent：什么时候用什么

| 维度 | Chain | Agent |
|---|---|---|
| 流程确定性 | 固定 DAG | 运行时动态规划 |
| 可控性 | 高 | 低（可能偏离预期） |
| 延迟 | 低（无推理循环） | 高（多次 LLM 调用） |
| 适用场景 | 明确流程（RAG/ETL） | 开放任务（助手/客服） |

**实战建议**: 优先用 Chain；当任务本身需要多步推理和工具调用时才引入 Agent；复杂场景中用 Chain 编排确定性步骤，Agent 处理其中的非确定性子任务。

## LangSmith：调试利器

LangSmith 是 LangChain 的可观测平台，用于追踪每一次调用:

- 可视化 Chain/Agent 的执行轨迹。
- 定位哪个 Tool 调用失败、哪次 LLM 返回不符合预期。
- A/B 对比不同 Prompt/模型的效果。

## 面试追问

- **"LCEL 的 `|` 操作符底层是什么？"** 是 Runnable 接口的 `__or__` 方法，返回 `RunnableSequence`。每个 Runnable 必须实现 `invoke/stream/batch`，这构成了 LangChain 的可组合性基础。
- **"Agent 为什么会陷入循环？如何避免？"** 原因: Tool 返回的信息不够清晰、LLM 无法判断是否已完成任务。解决方案: 设置 `max_iterations`、在 Prompt 中明确终止条件、Tool 返回值增加"任务完成"标记。
- **"如何保证 Agent 的安全性？"** 必须做 Tool 级别的权限控制和输入校验。例如文件系统 Tool 限定根目录、Shell Tool 用沙箱执行、敏感 Tool 需要人工确认（human-in-the-loop）。
- **"你提到的 Embedding 组件，检索时怎么选择向量数据库？"** 小规模（<10万条）用 Chroma/FAISS 本地跑就行；中大规模用 Milvus/Qdrant/Pinecone；有过滤需求用支持标量过滤的 Weaviate；低延迟用内存型如 Redis Vector。
