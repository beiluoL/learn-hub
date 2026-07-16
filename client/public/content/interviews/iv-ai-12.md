---
question: 如何设计一个企业级 AI Agent？需要考虑哪些核心要素？
category: ai
difficulty: hard
tags: "Agent, 多智能体, 工具调用, 记忆, 安全"
order: 44
---

企业级 AI Agent 不是一个单纯的 LLM 调用，而是一个整合了**规划、记忆、工具使用和行动**四大能力的自治系统。最关键的工程挑战不在模型层面，而在可靠性保障、安全边界和多 Agent 协作编排上。一个可落地的 Agent 系统和 Demo 之间的差距，约等于一个 MVP 和一个分布式生产服务的差距。

## Agent 的核心四要素

业界对 Agent 的经典定义来自 Lilian Weng 的总结: Agent = LLM + Planning + Memory + Tool Use。

### 1. 规划（Planning）

Agent 需要对复杂任务进行分解和排序:

#### ReAct（Reasoning + Acting）

最经典的模式，交替进行"思考"和"行动":

```
Thought: 我需要查询用户信息。用户没有提供 ID，我需要先通过姓名搜索。
Action: search_user(name="张三")
Observation: 找到 3 个匹配用户，ID 分别为 1001, 1002, 1003

Thought: 有 3 个匹配，我需要用户提供更多信息来确认。让我询问用户。
Action: ask_user("您是指哪个部门的张三？")
Observation: 用户回答"技术部"

Thought: 用"技术部"过滤。但 search_user 不返回部门信息，我需要查详细信息。
Action: get_user_detail(user_id=1001)
Observation: {"name": "张三", "department": "技术部", "role": "高级工程师"}

Thought: 用户1001匹配。同理验证1002、1003。然后返回结果。
Final Answer: 技术部的张三是用户ID 1001，职位为高级工程师。
```

#### Plan-and-Execute

先做完整计划，再逐步执行:

```python
# Plan-and-Execute 伪代码
plan = llm.plan("在 GitHub 上为项目创建 Release 并发布到 PyPI")
# plan = [
#   "步骤1: 从 CHANGELOG.md 提取最新版本的变更",
#   "步骤2: 生成 Release Notes",
#   "步骤3: 创建 Git Tag",
#   "步骤4: 用 gh CLI 创建 GitHub Release",
#   "步骤5: 构建并发布到 PyPI"
# ]

for step in plan.steps:
    result = executor.execute(step)
    if result.failed:
        # 重新规划
        plan = llm.replan(plan, failed_step=step, error=result.error)
```

**ReAct vs Plan-and-Execute 选型**:
- ReAct: 适合不确定性高、信息不完备的任务。
- Plan-and-Execute: 适合流程明确但步骤多的任务，可并行执行子任务。

在生产系统中，常采用**混合模式**: 高级规划用 Plan-and-Execute，每个子步骤的执行用 ReAct。

### 2. 记忆（Memory）

记忆系统是 Agent "跨越时间"工作能力的基础:

#### 短期记忆（Working Memory）

当前对话上下文，就是 LLM 的 context window。实现最简单——直接塞入 prompt。

```python
from langchain.memory import ConversationBufferWindowMemory

memory = ConversationBufferWindowMemory(
    k=10,  # 保留最近 10 轮对话
    return_messages=True,
)
```

#### 长期记忆（Vector Memory）

将历史对话、用户偏好、领域知识向量化后存入向量数据库，需要时检索:

```python
from langchain.memory import VectorStoreRetrieverMemory

# 将重要信息存入向量数据库
memory.save_context(
    {"input": "我在做一个电商项目"},
    {"output": "了解了，你正在开发电商项目"},
)
# 下次对话时，Agent 可以检索到用户是做电商的，自动适配建议

retriever_memory = VectorStoreRetrieverMemory(
    retriever=vectorstore.as_retriever(k=3),
    memory_key="long_term_history",
)
```

#### 摘要记忆（Summary Memory）

用 LLM 对长对话做摘要压缩，保留关键信息:

```python
from langchain.memory import ConversationSummaryMemory

memory = ConversationSummaryMemory(llm=llm, max_token_limit=500)
```

#### 生产环境记忆架构

```
User Input → Working Memory (当前上下文)
                ↓
           Relevance Check → 是否需要长期记忆?
                ↓ Yes
           Vector Search → 检索相关历史
                ↓
           Summary Compression (摘要压缩)
                ↓
           Merged Context (合并到当前上下文) → LLM
```

### 3. 工具使用（Tool Use）

工具是 Agent 与外部世界交互的唯一通道。设计不当的工具会直接导致 Agent 行为异常。

#### 工具设计规范

```python
from langchain.tools import tool
from pydantic import BaseModel, Field

class CreateOrderInput(BaseModel):
    """创建订单的参数 Schema——给 LLM 看的接口文档"""
    product_id: str = Field(description="商品ID，格式为 PROD-XXXX")
    quantity: int = Field(description="数量，必须大于 0 且不超过库存")
    customer_email: str = Field(description="客户邮箱，用于发送确认邮件")

@tool(args_schema=CreateOrderInput)
def create_order(product_id: str, quantity: int, customer_email: str) -> str:
    """在电商系统中创建新订单。返回订单号和预计配送日期。"""
    # 业务逻辑
    order_id = order_service.create(product_id, quantity, customer_email)
    return f"订单创建成功: 订单号 {order_id}，预计 3 天内配送"

# Tool 描述必须包含:
# 1. 功能说明（做什么）
# 2. 返回格式（返回什么）
# 3. 边角情况（如"如果商品ID无效，返回错误信息"）
```

**工具设计的陷阱**:
- 描述模糊: "查询信息"——Agent 不知道什么时候调用它。
- 参数语义不清: `id: str`——什么 ID？用户 ID？订单 ID？
- 返回值非结构化: 返回自然语言而非 JSON，增加 Agent 解析负担。
- 工具太"胖": 一个工具同时查询和修改数据库，不安全且难调试。

#### 工具调用的错误处理

```python
def safe_tool_execution(tool_func, args, max_retries=3):
    for attempt in range(max_retries):
        try:
            return tool_func(**args)
        except ParameterError as e:
            # 参数错误: 直接反馈给 LLM，让它修正
            return {"error": f"参数错误: {str(e)}", "retry": True}
        except ExternalAPIError as e:
            if attempt < max_retries - 1:
                time.sleep(2 ** attempt)  # 指数退避
                continue
            return {"error": f"外部服务不可用: {str(e)}"}
```

### 4. 行动（Action）

行动层将 Agent 的决策转化为实际效果:
- API 调用 / 数据库操作。
- 文件读写。
- 发送消息/邮件。
- 触发工作流（如 CI/CD pipeline）。

关键设计原则: **每个行动必须有明确的结果反馈**（成功/失败 + 具体数据），供 Agent 下一步推理。

## 安全设计：企业级 Agent 的分水岭

### Human-in-the-Loop（HITL）

涉及高风险操作时，必须人工确认:

```python
def execute_action(action):
    if action.risk_level == RiskLevel.HIGH:
        # 冻结，等待人工审批
        return HITLResponse(
            status="pending_approval",
            message=f"即将执行 {action.name}: {action.description}，是否继续？",
            action_id=generate_action_id(action),
        )
    else:
        return action.execute()
```

**需要 HITL 的操作**:
- 删除数据（DROP TABLE / DELETE WHERE）。
- 对外发送消息/邮件。
- 付费相关操作。
- 修改生产环境配置。

### 权限控制

```python
class AgentPermission:
    def __init__(self, user_role):
        self.allowed_tools = PERMISSION_MATRIX[user_role]

    def can_use(self, tool_name: str) -> bool:
        return tool_name in self.allowed_tools

# 权限矩阵
PERMISSION_MATRIX = {
    "admin": ["create_order", "delete_user", "view_reports", "run_sql"],
    "customer_service": ["create_order", "view_reports"],
    "viewer": ["view_reports"],
}
```

### 沙箱执行

Shell 命令、代码执行等危险工具必须在沙箱中运行:

```python
import docker

def execute_in_sandbox(code: str, language: str, timeout: int = 30):
    client = docker.from_env()
    container = client.containers.run(
        image=f"sandbox-{language}:latest",
        command=["run", code],
        network_disabled=True,    # 禁止网络访问
        mem_limit="256m",         # 限制内存
        cpu_period=100000,
        cpu_quota=50000,          # 限制 CPU 50%
        read_only=True,           # 只读文件系统
        detach=True,
    )
    try:
        result = container.wait(timeout=timeout)
        logs = container.logs().decode()
        return logs
    except docker.errors.APIError:
        return "执行超时或资源超限"
```

## 多 Agent 协作

### LangGraph：用状态图编排 Agent

LangGraph 将 Agent 逻辑建模为有状态的有向图:

```python
from langgraph.graph import StateGraph, END
from typing import TypedDict

class AgentState(TypedDict):
    messages: list
    next_step: str
    output: str

def supervisor(state: AgentState):
    """监督 Agent: 决定任务分配"""
    # LLM 分析任务，决定分配给哪个子 Agent
    ...

def code_agent(state: AgentState):
    """代码 Agent: 负责写代码"""
    ...

def review_agent(state: AgentState):
    """审查 Agent: 负责代码审查"""
    ...

# 构建工作流图
workflow = StateGraph(AgentState)
workflow.add_node("supervisor", supervisor)
workflow.add_node("coder", code_agent)
workflow.add_node("reviewer", review_agent)

# 添加边（含条件路由）
workflow.add_conditional_edges(
    "supervisor",
    lambda state: state["next_step"],
    {"code": "coder", "review": "reviewer", "finish": END},
)
workflow.add_edge("coder", "reviewer")
workflow.add_edge("reviewer", "supervisor")  # 审查完回到 supervisor 决策

workflow.set_entry_point("supervisor")
app = workflow.compile()
```

### CrewAI：基于角色分工的多 Agent

```python
from crewai import Agent, Task, Crew

researcher = Agent(
    role="技术研究员",
    goal="调研最新的大模型推理优化方案",
    backstory="你是一位资深AI研究员，擅长追踪前沿技术动态",
)

engineer = Agent(
    role="系统工程师",
    goal="将研究方案转化为可行的技术架构设计",
    backstory="你是一位10年经验的系统架构师",
)

task1 = Task(description="调研当前LLM推理优化top 5方案...", agent=researcher)
task2 = Task(description="基于研究结果设计技术方案...", agent=engineer)

crew = Crew(agents=[researcher, engineer], tasks=[task1, task2])
result = crew.kickoff()
```

## 评估与监控

### Agent 特有的评估维度

| 维度 | 指标 | 考察什么 |
|---|---|---|
| 任务完成率 | 在 N 次尝试中正确完成的比例 | 整体可靠性 |
| 工具选择准确率 | Agent 选择正确 Tool 的比例 | Tool 描述质量 |
| 平均步数 | 完成任务所需的行动步数 | 效率 |
| 重试率 | 需要重试或纠错的任务比例 | 鲁棒性 |
| 幻觉率 | 输出中无事实依据的断言比例 | 安全性 |
| 成本 | 每次任务消耗的 token 数 | 经济性 |

### 可观测性

```python
# Agent 执行追踪
from langsmith import traceable

@traceable(run_type="tool")
def search_database(query):
    return db.execute(query)

# 每次调用自动记录:
# - 输入参数
# - 输出结果
# - 执行耗时
# - 是否出错
```

推荐集成: LangSmith / Arize Phoenix / Weights & Biases。对于企业级部署，建议自建追踪系统——将所有 Agent 的每一步决策持久化到日志平台。

## 面试追问

- **"Agent 和传统的工作流引擎有什么区别？"** 传统工作流（如 Airflow）的执行路径是预定义的 DAG；Agent 的路径是 LLM 动态决策的。Agent 可以处理未预先建模的异常（如"API 返回了意外的错误码"），而工作流遇到未定义情况直接失败。
- **"如何防止 Agent 调用工具的无限循环？"** 三层防护: (1) 设置最大迭代次数 `max_iterations`（硬限制）；(2) 在 Prompt 中要求 Agent 在无法继续时明确说出原因并退出；(3) 监控层检测到重复调用同一 Tool 超过 3 次，强制中断。
- **"记忆系统的向量检索怎么保证时效性？"** 给记忆加上时间戳，检索时对历史越久的记忆做时间衰减。定期对记忆做清理和重新摘要。
- **"企业内部的 Tool 怎么安全暴露给 Agent？"** 不要在 Tool 中直接暴露 DB 连接或内网 API。使用 API Gateway 做访问控制和审计。Tool 实现层做输入校验、限流、敏感信息脱敏。
