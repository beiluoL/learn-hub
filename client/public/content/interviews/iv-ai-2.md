---
question: Agent（智能体）与传统 LLM 调用的区别？Tool Calling 是如何工作的？
category: ai
difficulty: hard
tags: "Agent, Tool Calling, 编排"
order: 11
---

**区别：**传统调用是"一次提问一次回答"；Agent 让模型**自主规划、循环调用工具、根据结果迭代**直到完成任务。

**Tool Calling 流程：**

1.  开发者用 JSON Schema 描述可用工具（名称、参数、用途）
2.  把工具列表随对话发给支持 function calling 的模型
3.  模型不直接回答，而是输出"要调用 tool\_x，参数 {...}"
4.  运行时执行该工具，把结果回灌模型
5.  模型据结果继续思考/调用，直到给出最终答案

关键点：明确的停止条件、错误恢复、工具结果回灌的上下文管理。
