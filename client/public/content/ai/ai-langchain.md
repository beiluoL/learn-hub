---
title: LangChain 框架深入
category: ai
level: intermediate
readMinutes: 18
tags: "LangChain, Chain, Agent, Tool"
summary: LangChain 框架深入：Chain、Agent 与 Tool 体系。
order: 23
prereq: ai/ai-prompt
---

## LangChain 核心概念

LangChain 是一个构建 LLM 应用的框架，它提供了统一的接口来组合模型、工具、数据源和记忆，使开发者能够快速构建复杂的 AI 应用。

LangChain 的核心模块可以分为六大组件：

| 组件 | 职责 | 典型示例 |
|------|------|---------|
| Model I/O | 模型调用与格式化 | ChatOpenAI, PromptTemplate |
| Retrieval | 文档检索 | VectorStore, DocumentLoader |
| Chains | 组合多个组件 | LLMChain, SequentialChain |
| Agents | 自主推理与工具调用 | ReAct Agent, OpenAI Functions |
| Memory | 上下文持久化 | ConversationBufferMemory |
| Callbacks | 日志与监控 | LangSmith, ConsoleCallbackHandler |

## Model I/O：提示模板与模型调用

### PromptTemplate

LangChain 将提示与逻辑分离，支持变量注入和模板复用：

```python
from langchain.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain.chat_models import ChatOpenAI

# 系统指令 + 对话历史的聊天模板
prompt = ChatPromptTemplate.from_messages([
    ("system", "你是一个{role}，擅长{skill}。回答时保持专业和简洁。"),
    MessagesPlaceholder(variable_name="history"),
    ("human", "{input}")
])

llm = ChatOpenAI(model="gpt-4", temperature=0.7)

# 组成链
chain = prompt | llm

response = chain.invoke({
    "role": "Python 编程助手",
    "skill": "代码调试和优化",
    "history": [],
    "input": "如何优化这段列表推导式？"
})
```

**关键注意**：LangChain Expression Language（LCEL）使用 `|` 管道符串联组件，这是 LangChain 推荐的现代写法。`chain.invoke()` 是同步调用，`chain.ainvoke()` 是异步调用。

### 输出解析器

将 LLM 的原始文本输出解析为结构化数据：

```python
from langchain.output_parsers import PydanticOutputParser
from pydantic import BaseModel, Field

class CodeReview(BaseModel):
    score: int = Field(description="代码质量评分 (1-10)")
    issues: list[str] = Field(description="发现的问题列表")
    suggestion: str = Field(description="改进建议")

parser = PydanticOutputParser(pydantic_object=CodeReview)

prompt = ChatPromptTemplate.from_messages([
    ("system", "你是一个代码审查专家。\n{format_instructions}"),
    ("human", "请审查以下代码:\n```python\n{code}\n```")
])

# 将格式指令注入提示
prompt = prompt.partial(format_instructions=parser.get_format_instructions())

chain = prompt | llm | parser
result = chain.invoke({"code": "def add(a,b): return a+b"})
```

## Chain：组合式工作流

Chain 将多个组件串联为端到端流水线。从简单的 LLMChain 到复杂的多步骤处理。

### 基础 Chain 类型

```python
from langchain.chains import LLMChain, SimpleSequentialChain

# 步骤 1: 生成提纲
outline_chain = LLMChain(
    llm=llm,
    prompt=ChatPromptTemplate.from_template(
        "为主题'{topic}'生成一个包含5个要点的提纲"
    )
)

# 步骤 2: 基于提纲生成详细内容
detail_chain = LLMChain(
    llm=llm,
    prompt=ChatPromptTemplate.from_template(
        "基于以下提纲写一篇详细文章:\n{outline}"
    )
)

# 串联
sequential_chain = SimpleSequentialChain(
    chains=[outline_chain, detail_chain],
    verbose=True
)

result = sequential_chain.run("深度学习入门")
```

### Conversational Retrieval QA Chain

结合文档检索和对话上下文的问答链是 RAG 应用的典型模式：

```python
from langchain.chains import ConversationalRetrievalChain
from langchain.memory import ConversationBufferMemory

memory = ConversationBufferMemory(
    memory_key="chat_history",
    return_messages=True
)

qa_chain = ConversationalRetrievalChain.from_llm(
    llm=llm,
    retriever=vector_store.as_retriever(
        search_kwargs={"k": 4}
    ),
    memory=memory,
    chain_type="stuff",  # 将所有文档拼接为上下文
    verbose=True
)

response = qa_chain.invoke({
    "question": "LangChain 的 Agent 如何工作？"
})
```

## Agent：自主推理与工具调用

Agent 是 LangChain 最具特色的组件，它赋予 LLM 推理和决策能力。Agent 接收用户输入后，自主决定调用哪些工具、以什么顺序调用，直到得出结论。

### ReAct Agent

ReAct（Reasoning + Acting）是最经典的 Agent 类型，交替进行推理和行动：

```python
from langchain.agents import initialize_agent, AgentType
from langchain.tools import Tool
from langchain_community.utilities import SerpAPIWrapper

# 定义工具
search = SerpAPIWrapper()
calculator_tool = Tool(
    name="Calculator",
    func=lambda x: eval(x),
    description="用于执行数学计算。输入应为数学表达式。"
)

tools = [
    Tool(
        name="Search",
        func=search.run,
        description="当需要获取实时信息时使用。输入为搜索查询词。"
    ),
    calculator_tool,
]

agent = initialize_agent(
    tools=tools,
    llm=llm,
    agent=AgentType.ZERO_SHOT_REACT_DESCRIPTION,
    verbose=True,
    handle_parsing_errors=True,
    max_iterations=5
)

response = agent.invoke({
    "input": "今天的比特币价格是多少？如果我用5000美元买入，能买到多少？"
})
```

### 自定义 Tool

定义工具需要清晰的 name 和 description，这直接影响 Agent 的能力：

```python
from langchain.tools import tool

@tool
def get_stock_price(symbol: str) -> str:
    """获取指定股票代码的最新价格。symbol 参数为股票代码，如 AAPL。"""
    # 实际应用中调用 API
    import yfinance as yf
    stock = yf.Ticker(symbol)
    price = stock.fast_info.last_price
    return f"{symbol} 最新价格: ${price:.2f}"

@tool
def calculate_roi(investment: float, returns: float) -> str:
    """计算投资回报率。investment 为投入金额，returns 为回报金额。"""
    roi = (returns - investment) / investment * 100
    return f"投资回报率: {roi:.1f}%"
```

## Memory：上下文持久化

```python
from langchain.memory import (
    ConversationBufferWindowMemory,
    ConversationSummaryMemory,
)

# 滑动窗口记忆（仅保留最近 K 轮对话）
window_memory = ConversationBufferWindowMemory(k=5)

# 摘要记忆（用 LLM 将长对话压缩为摘要）
summary_memory = ConversationSummaryMemory(llm=llm, max_token_limit=200)
```

## LangSmith：调试与监控

LangSmith 是 LangChain 官方推出的调试平台，在项目中设置环境变量后自动记录每次调用的完整链路：

```yaml
# .env 配置
LANGCHAIN_TRACING_V2=true
LANGCHAIN_API_KEY=ls__your_key
LANGCHAIN_PROJECT=my-rag-app
```

它能记录每次推理的步骤、token 消耗、延迟和中间结果，对排查 Agent 行为异常尤其有用。

## LangGraph：状态图工作流

LangGraph 将 Agent 工作流建模为图结构，节点是处理步骤，边是状态转移。相比简单 Chain，它支持条件分支、循环和状态管理：

```python
from langgraph.graph import StateGraph, END
from typing import TypedDict, Annotated

class AgentState(TypedDict):
    messages: list
    next_action: str

workflow = StateGraph(AgentState)

# 定义节点
def process_input(state):
    # 处理逻辑
    return {"next_action": "search"}

def search_function(state):
    # 搜索逻辑
    return {"next_action": "verify"}

# 添加节点和边
workflow.add_node("process", process_input)
workflow.add_node("search", search_function)
workflow.add_edge("process", "search")
workflow.add_conditional_edges(
    "search",
    lambda s: s["next_action"],
    {"verify": "verify_node", "answer": "answer_node"}
)
```

## 实际开发中的应用 / 常见问题

### 如何选择 Agent 类型？

- **OpenAI Functions**：最可靠，推荐优先使用
- **ReAct**：有链式推理需求，模型需要支持工具调用
- **Structured Chat**：需要多步工具组合且工具输入复杂

### Chain 和 Agent 的区别？

Chain 是预定义的固定流程，Agent 是动态决策流程。如果你清楚每一步做什么，用 Chain；如果需要 LLM 自主决定下一步，用 Agent。

### 为什么 Agent 总是调用错误的工具？

工具描述（description）是 Agent 正确选择工具的关键。描述应清晰说明：何时使用该工具、输入参数格式、返回结果的含义。

### 如何处理长对话上下文？

使用 ConversationSummaryMemory 压缩历史，或将对话摘要存入 VectorStore 实现长期记忆。对于超长对话，考虑使用滑动窗口 + 摘要的组合策略。

### LangChain 的常见性能问题

每次调用可能涉及多次 LLM 请求（尤其在 Agent 场景），导致延迟较高和成本增加。优化建议：缓存重复调用、使用更小的模型做中间步骤、设置 max_iterations 上限避免死循环。
