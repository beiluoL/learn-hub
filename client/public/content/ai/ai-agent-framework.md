---
title: AI Agent 框架与多智能体协作
category: ai
level: advanced
readMinutes: 20
tags: "Agent, AutoGPT, CrewAI, 多智能体"
summary: AI Agent 框架对比与多智能体协作。
order: 30
prereq: ai/ai-agent
---

## Agent 核心架构

AI Agent 是能够自主感知环境、做出决策、执行行动并从结果中学习的新型系统。与传统的 LLM 调用不同，Agent 并非被动响应，而是主动规划并执行多步操作。

Agent 的核心循环：**感知 → 思考 → 行动 → 观察 → 反思**

```
┌─────────────────────────────────────────┐
│            Agent 核心循环                │
│                                         │
│   用户输入 → 理解意图 → 制定计划          │
│       ↓                                 │
│   执行工具调用 → 获取结果                 │
│       ↓                                 │
│   评估结果 → 是否满足目标？               │
│       ↓           ↓                    │
│       否         是                     │
│       ↓           ↓                    │
│   调整计划    →  返回最终答案             │
└─────────────────────────────────────────┘
```

## 推理框架

### ReAct

ReAct（Reasoning + Acting）是最基础的 Agent 推理框架，交替进行推理思考（Thought）和工具执行（Action）：

```
用户问题：纽约到伦敦的距离和飞行时间？

Thought: 我需要先搜索纽约到伦敦的距离
Action: 搜索"纽约到伦敦距离"
Observation: 约 5570 公里

Thought: 有了距离，现在需要计算飞行时间。客机巡航速度约 900 km/h
Action: 计算 5570 / 900
Observation: 约 6.19 小时

Final Answer: 纽约到伦敦约 5570 公里，飞行时间约 6.2 小时
```

### LATS

LATS（Language Agent Tree Search）是 Tree of Thought 的增强版，结合蒙特卡洛树搜索（MCTS）进行推理。它在每个决策点生成多个候选行动，通过探索和利用的平衡来找出最佳路径：

```python
# LATS 伪代码（核心思想）
def lats_decision(agent, state, max_depth=5):
    root = TreeNode(state)

    for _ in range(max_simulations):
        # 选择最有希望的节点
        node = select_node(root)

        # 扩展：生成候选行动
        if not node.is_terminal():
            actions = agent.generate_actions(node.state)
            node = node.expand(actions)

        # 模拟：从该节点开始随机模拟完成
        result = agent.simulate(node.state)

        # 回溯：更新路径上所有节点的价值
        backpropagate(node, result)

    # 返回价值最高的子节点对应的行动
    return best_child(root).action
```

LATS 相比 ReAct 更擅长需要多步规划的任务，但计算开销更大。

## Tool Use 与 Function Calling

Tool Use 赋予 Agent 与外部世界交互的能力。设计良好的工具系统是 Agent 可靠性的核心。

### 工具设计原则

```python
# 设计良好的工具 Schema
WEATHER_TOOL = {
    "name": "get_weather",
    "description": "获取指定城市当前的天气信息。仅当用户明确询问天气时使用。",
    "parameters": {
        "type": "object",
        "properties": {
            "city": {
                "type": "string",
                "description": "城市名称，如 Beijing、New York"
            },
            "date": {
                "type": "string",
                "description": "查询日期，格式 YYYY-MM-DD。不提供则返回今天数据。"
            }
        },
        "required": ["city"]
    }
}
```

**关键设计原则**：
1. **描述要精确**：说明"何时使用"比说明"做什么"更重要
2. **参数要限制**：使用 enum 约束可选值，提供清晰的格式说明
3. **幂等性**：同一输入多次调用应产生相同结果（GET 型工具）
4. **错误处理**：工具应返回有意义的错误信息而非原始异常

### 工具编排模式

```python
# 工具编排：工具链 vs 工具集
from typing import Callable

class ToolOrchestrator:
    """工具编排器：管理工具的注册与调用"""

    def __init__(self):
        self.tools: dict[str, dict] = {}

    def register(self, name: str, func: Callable, description: str):
        self.tools[name] = {
            "func": func,
            "description": description
        }

    def get_tool_descriptions(self) -> str:
        """生成工具描述供 LLM 理解"""
        return "\n".join(
            f"- {name}: {info['description']}"
            for name, info in self.tools.items()
        )

    def execute(self, tool_name: str, **kwargs):
        if tool_name not in self.tools:
            return f"错误: 工具 {tool_name} 不存在"
        try:
            return self.tools[tool_name]["func"](**kwargs)
        except Exception as e:
            return f"工具执行失败: {str(e)}"

# 注册工具
orchestrator = ToolOrchestrator()
orchestrator.register(
    "计算器", eval,
    "执行数学计算，输入为如 '2+3*4' 的表达式"
)
orchestrator.register(
    "查询天气",
    lambda city: f"{city}今天晴朗，25°C",
    "查询城市天气，输入为城市名称"
)
```

## AutoGPT：自主规划与执行

AutoGPT 是最早引起广泛关注的自主 Agent 项目，展现了 LLM 自主规划并执行长期任务的可能性。

其核心机制包括：
- **目标分解**：将用户的大目标拆解为子任务
- **自我提示**：Agent 给下一步的自己设定方向和指令
- **记忆管理**：将历史思考和结果存入向量数据库
- **网络访问**：通过浏览器工具搜索和获取信息

AutoGPT 适用于调研类任务，但存在执行不稳定、成本高、容易陷入循环等问题。

## CrewAI：多 Agent 协作

CrewAI 是专门为多智能体协作设计的框架，模拟人类团队的工作模式。每个 Agent 被赋予特定角色、目标和背景故事：

```python
from crewai import Agent, Task, Crew, Process

# 定义角色化 Agent
researcher = Agent(
    role="资深研究员",
    goal="深入调研指定主题，找出关键洞察和数据",
    backstory="你是一位有 15 年经验的技术研究员，擅长信息检索和分析",
    llm=llm,
    tools=[search_tool, web_scraper],
    verbose=True
)

analyst = Agent(
    role="数据分析师",
    goal="基于研究数据进行分析和可视化",
    backstory="你擅长从数据中发现规律并生成直观的可视化报告",
    llm=llm,
    tools=[calculator, chart_generator],
    verbose=True
)

writer = Agent(
    role="技术撰稿人",
    goal="将分析结果撰写为清晰易读的技术报告",
    backstory="你是一名经验丰富的技术作家，擅长将复杂概念转化为易懂文章",
    llm=llm,
    verbose=True
)

# 定义任务与依赖关系
research_task = Task(
    description="调研 2024 年 AI Agent 领域的发展趋势",
    expected_output="一份包含关键趋势、代表项目和数据的调研报告",
    agent=researcher
)

analysis_task = Task(
    description="基于调研报告分析市场格局和技术成熟度",
    expected_output="包含图表的数据分析报告",
    agent=analyst,
    context=[research_task]  # 依赖前一个任务的结果
)

write_task = Task(
    description="基于分析报告撰写一篇面向开发者的趋势文章",
    expected_output="2000 字的 Markdown 排版技术文章",
    agent=writer,
    context=[analysis_task]
)

# 组建团队并执行
crew = Crew(
    agents=[researcher, analyst, writer],
    tasks=[research_task, analysis_task, write_task],
    process=Process.sequential,  # 顺序执行
    verbose=True
)

result = crew.kickoff()
```

## LangGraph 构建 Agent 工作流

LangGraph 用有向图建模 Agent 流程，特别适合构建有分支和循环的复杂工作流：

```python
from langgraph.graph import StateGraph, END
from langgraph.prebuilt import ToolNode
from typing import TypedDict, Annotated
import operator

class AgentState(TypedDict):
    messages: Annotated[list, operator.add]
    iteration_count: int

# 定义图
workflow = StateGraph(AgentState)

# 添加节点
workflow.add_node("agent", agent_node)          # LLM 决策
workflow.add_node("tools", ToolNode(tools))     # 工具执行

# 添加边
workflow.set_entry_point("agent")
workflow.add_conditional_edges(
    "agent",
    router,  # 根据 LLM 输出决定下一步
    {"tools": "tools", "end": END}
)
workflow.add_edge("tools", "agent")  # 工具执行后返回 Agent

# 编译并运行
app = workflow.compile()
result = app.invoke({
    "messages": [HumanMessage(content="帮我调研今天科技新闻")]
})
```

## 记忆机制

Agent 的记忆分为三个层次：

| 类型 | 存储内容 | 实现方式 | 生命周期 |
|------|---------|---------|---------|
| 短期记忆 | 当前对话上下文 | 消息列表 + 滑动窗口 | 单次会话 |
| 长期记忆 | 重要对话摘要、用户偏好 | 向量数据库 + 检索 | 跨会话 |
| 工作记忆 | 当前任务的中间结果 | 结构化状态对象 | 单次任务 |

```python
class AgentMemory:
    def __init__(self, vector_store):
        self.short_term = []  # 最近 N 轮对话
        self.long_term = vector_store  # 持久化向量记忆
        self.working_memory = {}  # 当前任务状态

    def add_to_short_term(self, message):
        self.short_term.append(message)
        if len(self.short_term) > 20:
            # 将旧消息压缩存入长期记忆
            summary = self.summarize(self.short_term[:10])
            self.long_term.add(summary)
            self.short_term = self.short_term[10:]

    def retrieve_context(self, query):
        """检索相关上下文"""
        recent = self.short_term[-5:]
        relevant = self.long_term.search(query, top_k=3)
        return relevant + recent
```

## 安全：Human-in-the-Loop

对于高风险操作，必须引入人工审核机制：

```python
# 关键操作前中断等待确认
def critical_action_handler(state):
    if state["action_type"] in ["delete_data", "send_email", "make_payment"]:
        # 暂停执行，等待人工确认
        return {"status": "pending_human_approval"}

    return state

# 在 LangGraph 中实现
workflow.add_node("approval_check", critical_action_handler)
workflow.add_conditional_edges(
    "approval_check",
    lambda s: "end" if "pending" in s["status"] else "continue"
)
```

## 实际开发中的应用 / 常见问题

### Agent 不可靠怎么办？

Agent 的确定性低于传统程序。通过以下手段提升可靠性：工具返回结构化结果（带状态码）、设置最大步数限制、实现重试和回退机制、对关键输出做格式验证。

### 多 Agent 如何避免混乱？

为每个 Agent 赋予清晰的角色和职责边界。使用结构化的任务输出格式（JSON Schema），确保上游 Agent 输出能被下游 Agent 可靠解析。

### 成本如何控制？

Agent 的 token 消耗远高于单次 LLM 调用。优化：使用更小模型做中间推理步骤、缓存重复查询、设置预算上限、对简单任务用规则而非 LLM 决策。

### 什么时候不需要 Agent？

如果任务流程固定且无需动态决策（如固定的文档摘要流水线），直接用 Chain 更稳定、更高效、更便宜。
