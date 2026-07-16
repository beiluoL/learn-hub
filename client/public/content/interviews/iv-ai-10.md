---
question: Prompt Engineering 的核心技巧有哪些？如何写出高质量 Prompt？
category: ai
difficulty: middle
tags: "Prompt Engineering, Few-shot, CoT, 结构化输出"
order: 42
---

Prompt Engineering 的本质是**用自然语言编程 LLM**。核心技巧可以归纳为六字口诀: "说清楚、给例子"。高质量 Prompt = 清晰的角色设定 + 结构化的任务描述 + 恰当的输出格式 + 精选的示例，缺一不可。

## 核心原则一：清晰指令——让模型知道"做什么"而非"怎么做"

糟糕的 Prompt 和好的 Prompt 往往只差在"清楚程度"上:

```
# 糟糕: 指令模糊
"写一个排序算法。"

# 良好: 指定语言、场景、格式、约束
"用 Python 实现一个快速排序函数。
- 函数签名: def quicksort(arr: List[int]) -> List[int]
- 要求原地排序，空间复杂度 O(log n)。
- 需要包含输入验证（空数组/非整数元素抛异常）。
- 附带 3 个测试用例的注释。"
```

**清晰指令的五要素**:

1. **角色设定**: "你是一位资深 Python 工程师"。
2. **任务描述**: "实现一个...功能"。
3. **格式约束**: "用 Markdown 代码块输出"。
4. **边界说明**: "不需要额外解释" 或 "请解释实现思路"。
5. **负面示例**: "不要使用外部库"。

### 实践中确保清晰性的技巧

- **使用分隔符**: 用 `###` 或 `---` 或 XML 标签分隔指令、示例、输入，避免歧义。
- **要求结构化输出**: 指定 JSON 格式并给出 schema，减少后处理成本。
- **指定步骤**: 对复杂任务明确子步骤——"第一步: 分析需求；第二步: 给出方案；第三步: 输出代码"。

## 核心原则二：Few-shot 示例——教模型正确的"范式"

LLM 本质是模式匹配机器。给它看 2-5 个高质量的输入→输出示例，效果往往比写一千字的指令描述更好:

```
将口语化的中文需求转化为 SQL 查询。

示例 1:
输入: "查一下上个月销售额超过 10 万的商品"
输出:
```sql
SELECT product_name, SUM(amount) AS total_sales
FROM orders
WHERE order_date >= DATE_SUB(CURDATE(), INTERVAL 1 MONTH)
  AND order_date < CURDATE()
GROUP BY product_name
HAVING total_sales > 100000;
```

示例 2:
输入: "统计每个部门的平均工资，按平均工资降序排列"
输出:
```sql
SELECT department, AVG(salary) AS avg_salary
FROM employees
GROUP BY department
ORDER BY avg_salary DESC;
```

现在请处理:
输入: "找出过去 7 天没有登录过的活跃用户"
```

### Few-shot 示例选择技巧

1. **覆盖边界情况**: 选至少一个"正常"案例和一个"边界"案例。
2. **示例与任务同分布**: 如果任务是中文转 SQL，示例应该是中文→SQL，而不是英文→SQL。
3. **示例的顺序**: 主流 LLM 对末尾的示例更敏感，把最关键的示例放在最后。
4. **动态选择示例**: 在生产环境中，从示例库中检索与当前输入最相似的示例（Example Selection），效果远优于固定示例。

## 核心原则三：思维链（Chain of Thought）——逼模型"想清楚再回答"

CoT 是 Prompt Engineering 中最具影响力的技术之一。核心思想: 要求模型在给出最终答案之前，先输出推理步骤。

```
# 普通 Prompt
"班上有 23 个学生，每个学生有 5 本书，5 个学生转学了。现在还剩多少本书？"

# CoT Prompt
"班上有 23 个学生，每个学生有 5 本书，5 个学生转学了。现在还剩多少本书？
让我们一步步思考:"

# 模型输出（带推理过程）
```
步骤 1: 初始有 23 个学生
步骤 2: 5 个学生转学 → 剩余 23 - 5 = 18 个学生
步骤 3: 每个学生有 5 本书 → 总共 18 × 5 = 90 本书
答案: 90 本书
```
```

### CoT 为什么有效

1. **将隐式推理外显化**: 语言模型在 autoregressive 生成时，前一个 token 影响后一个 token。写出推理步骤让正确逻辑在 token 序列中传播。
2. **降低一步到位的难度**: 复杂问题直接跳到答案难度极大。CoT 将问题分解为多个简单步骤，每步都在模型能力范围内。
3. **自我验证**: 推理过程中的中间量可以被模型自身利用和纠错。

### CoT 的变体

- **Zero-shot CoT**: 只需加 `Let's think step by step`，无需示例。简单任务即可生效。
- **Few-shot CoT**: 给 2-3 个带推理过程的示例。复杂任务必需。
- **Self-Consistency**: 多次生成取多数答案。解决 CoT 不稳定的问题——用投票提高鲁棒性。
- **Tree of Thoughts（ToT）**: 每一步探索多条推理路径，剪枝后继续。代价高但推理质量上限更高。

## 核心原则四：角色设定（System Prompt）

通过 System Prompt 设定模型的全局行为:

```
# 精准的角色设定
你是一个经验丰富的代码审查者。你的审查标准:
- 关注安全性（注入、越权、敏感信息泄露）。
- 关注性能（N+1 查询、不必要的循环）。
- 输出格式: 严重性分级（致命/警告/建议），每一条附带行号和修复方案。
- 不要评论命名风格（这是代码格式化工具的工作）。
```

**角色设定的最佳实践**:
- 角色越具体，输出一致性越高。
- 用"必须"和"不要"代替"请"和"如果可能"。
- 将角色、输出格式、约束写到 System Prompt，将具体任务写到 User Prompt。

## 核心原则五：结构化输出

让模型输出可被程序解析的格式:

```
# 使用 JSON Mode（需要 model 支持）
请分析以下代码的复杂度，以 JSON 格式输出:
{
  "time_complexity": "O(n log n)",
  "space_complexity": "O(1)",
  "is_optimal": true,
  "suggestions": ["可以用 XXX 优化"]
}
```

**进阶**: Pydantic + Instructor 库:

```python
from pydantic import BaseModel
from openai import OpenAI

class CodeAnalysis(BaseModel):
    time_complexity: str
    space_complexity: str
    is_optimal: bool
    suggestions: list[str]

client = OpenAI()
completion = client.chat.completions.create(
    model="gpt-4-2024-08-06",
    response_format={"type": "json_schema", "json_schema": {
        "name": "code_analysis",
        "schema": CodeAnalysis.model_json_schema()
    }},
    messages=[...],
)
result = CodeAnalysis.model_validate_json(completion.choices[0].message.content)
```

## 常见误区与纠正

| 误区 | 纠正 |
|---|---|
| Prompt 写得太"礼貌" | LLM 不理解"礼貌"，精准比友善重要 |
| 一次给太多任务 | 复杂任务拆成多个子 Prompt |
| 对模型"恐吓"（不说就扣100万） | 无效且可能触发安全过滤 |
| 不指定输出格式导致解析困难 | 必须指定 JSON/Markdown 等明确格式 |
| 只用一种 Prompt 测试 | A/B 测试 2-3 种变体，用指标评估 |
| 忽略 Token 预算 | 长 Prompt 压缩任务指令空间，消耗成本 |

## 多模态 Prompt

现代 Prompt Engineering 已超出纯文本范畴:

- **Vision**: `![image](url)` 嵌入图片，描述或提问。
- **Audio**: 语音输入转文字后再做 Prompt。
- **Function Calling / Tool Use**: 不是"文本指令"而是"函数声明"，让模型调用外部工具。

多模态 Prompt 的关键: 明确告诉模型"这张图片中你应该关注什么"。例如"请检查这张信用卡截图，提取卡号后四位"——少了"后四位"指令，模型可能输出完整的卡号。

## 面试追问

- **"System Prompt 能防止越狱攻击吗？"** 不能。System Prompt 是"建议"而非"约束"。对抗性攻击者可以绕过的办法很多（角色扮演、编码指令、多轮渐进式引导）。安全需要在模型层（RLHF/安全微调）和架构层（内容过滤/输入输出审查）多重防护。
- **"Few-shot 示例越多越好吗？"** 不是。3-5 个示例通常是甜点区。太少效果不足，太多则占用上下文窗口、增加成本、可能让模型混淆矛盾示例。超过 10 个时需用 RAG 动态选择。
- **"CoT 在简单任务上是否有害？"** 可能。对于简单的分类/翻译/摘要任务，CoT 不仅浪费 token 成本，还可能引入"过度推理"的噪声。只对需要多步推理的任务使用。
- **"如何系统性地优化 Prompt？"** 建立 Prompt 版本管理 + 评测集（至少 50 条手工标注的测试用例）→ 自动化评测（LLM-as-Judge 或准确率/格式合规率）→ 迭代调优。这就是 DSPy 框架的设计思路——将 Prompt 优化变为编程问题而非手艺活。
