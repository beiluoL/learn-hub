---
title: Agent：智能体与工具调用
category: ai
level: advanced
readMinutes: 19
tags: "Agent, Tool Calling, 编排, 规划"
summary: 让 LLM 自主规划、调用工具、循环迭代完成复杂任务。
order: 3
---

## 一、Agent 基本形态

Agent = LLM（大脑）+ 工具（手）+ 记忆（上下文）+ 规划（循环）。模型不再只生成文本，而是输出"调用哪个工具、参数是什么"，由运行时执行后把结果回灌模型，循环直到任务完成。

## 二、ReAct 范式

Reason + Act：模型交替进行**思考（Thought）**与**行动（Action）**，观察（Observation）结果后再思考，形成闭环：

```
Thought: 我需要先查天气
Action: weather(city="北京")
Observation: 晴 26°C
Thought: 已获信息，可作答
Answer: 北京今天晴，26°C...
```

## 三、工程要点

-   **工具定义**：用 JSON Schema 描述名称、参数、用途，便于模型选择
-   **终止条件**：明确"何时停止"，防止无限循环（最大步数限制）
-   **错误恢复**：工具失败要反馈给模型让其重试/换路
-   **记忆**：短期用上下文窗口，长期用向量库/数据库

主流框架：LangChain / LlamaIndex（编排），AutoGen / MetaGPT（多智能体协作）。
