// AI 应用开发文章内容
export const aiArticles = [
  {
    id: 'ai-prompt',
    title: 'Prompt Engineering：提示词工程',
    level: 'beginner',
    readMinutes: 12,
    tags: ['Prompt', 'LLM', '入门'],
    summary: '掌握结构化提示词技巧，稳定提升大模型输出质量。',
    content: `
<h2>一、为什么需要提示词工程</h2>
<p>大模型是"概率生成"，同样的问题不同表述结果差异很大。提示词工程通过<b>明确任务、约束格式、提供示例</b>来引导输出。</p>

<h2>二、核心技巧</h2>
<ul>
  <li><b>角色设定</b>：让模型扮演专家（"你是一名资深 Java 工程师"）</li>
  <li><b>任务+上下文+格式</b>三段式：要做什么、已知信息、期望输出结构</li>
  <li><b>少样本（Few-shot）</b>：给 1~3 个示例，明显提升一致性</li>
  <li><b>思维链（CoT）</b>：加"请一步步思考"，提升复杂推理</li>
  <li><b>约束</b>：限定字数、输出 JSON、禁止某些内容</li>
</ul>
<pre><code>你是一名运维助手。
任务：根据错误日志给出根因与修复建议。
输出格式（严格 JSON）：
{"root_cause": "...", "fix": ["步骤1", "步骤2"]}
日志：{{日志内容}}</code></pre>
<h2>三、避坑</h2>
<p>避免模糊指令；对关键输出要求结构化（JSON）并做校验；敏感场景加"若信息不足请说不知道"。</p>
`,
  },
  {
    id: 'ai-rag',
    title: 'RAG：检索增强生成',
    level: 'intermediate',
    readMinutes: 18,
    tags: ['RAG', '向量库', '检索', 'Embedding'],
    summary: '用私有知识 + 检索喂给 LLM，解决"幻觉"与知识时效问题。',
    content: `
<h2>一、RAG 是什么</h2>
<p>Retrieval-Augmented Generation：先把用户问题检索到的相关文档片段拼进提示词，再让 LLM 基于这些证据作答。比单纯微调更适合频繁更新的私有知识。</p>

<h2>二、典型流程</h2>
<ol>
  <li><b>索引</b>：文档切分（chunk）→ Embedding 向量化 → 存入向量库</li>
  <li><b>检索</b>：query 向量化 → 向量相似度（cosine）召回 Top-K</li>
  <li><b>生成</b>：把召回片段 + 问题拼成 Prompt 交给 LLM</li>
</ol>
<pre><code># 伪代码
chunks = split(doc)
vectors = embed(chunks)
store.upsert(vectors)
hits = store.search(embed(query), top_k=5)
answer = llm(prompt = hits + question)</code></pre>

<h2>三、关键优化点</h2>
<ul>
  <li>切分策略：按语义/标题切，避免截断；重叠（overlap）保留上下文</li>
  <li>混合检索：向量 + 关键词（BM25）融合，召回更稳</li>
  <li>重排（Rerank）：用交叉编码器对候选再排序</li>
  <li>引用溯源：输出附带来源片段，便于核查</li>
</ul>
`,
  },
  {
    id: 'ai-agent',
    title: 'Agent：智能体与工具调用',
    level: 'advanced',
    readMinutes: 19,
    tags: ['Agent', 'Tool Calling', '编排', '规划'],
    summary: '让 LLM 自主规划、调用工具、循环迭代完成复杂任务。',
    content: `
<h2>一、Agent 基本形态</h2>
<p>Agent = LLM（大脑）+ 工具（手）+ 记忆（上下文）+ 规划（循环）。模型不再只生成文本，而是输出"调用哪个工具、参数是什么"，由运行时执行后把结果回灌模型，循环直到任务完成。</p>

<h2>二、ReAct 范式</h2>
<p>Reason + Act：模型交替进行<b>思考（Thought）</b>与<b>行动（Action）</b>，观察（Observation）结果后再思考，形成闭环：</p>
<pre><code>Thought: 我需要先查天气
Action: weather(city="北京")
Observation: 晴 26°C
Thought: 已获信息，可作答
Answer: 北京今天晴，26°C...</code></pre>

<h2>三、工程要点</h2>
<ul>
  <li><b>工具定义</b>：用 JSON Schema 描述名称、参数、用途，便于模型选择</li>
  <li><b>终止条件</b>：明确"何时停止"，防止无限循环（最大步数限制）</li>
  <li><b>错误恢复</b>：工具失败要反馈给模型让其重试/换路</li>
  <li><b>记忆</b>：短期用上下文窗口，长期用向量库/数据库</li>
</ul>
<p>主流框架：LangChain / LlamaIndex（编排），AutoGen / MetaGPT（多智能体协作）。</p>
`,
  },
  {
    id: 'ai-vector',
    title: '向量数据库与 Embedding',
    level: 'intermediate',
    readMinutes: 15,
    tags: ['向量库', 'Embedding', '相似度', '检索'],
    summary: '理解文本向量化与近似最近邻检索，支撑 RAG/Agent 记忆。',
    content: `
<h2>一、Embedding 是什么</h2>
<p>将文本映射为稠密向量（如 1536 维），语义相近的文本向量距离更近。模型如 OpenAI text-embedding、BGE、m3e 等。</p>

<h2>二、向量检索</h2>
<p>把查询向量与库中向量比较相似度（常用余弦距离），取 Top-K。大规模下用<b>近似最近邻（ANN）</b>算法加速：</p>
<table>
  <tr><th>算法</th><th>特点</th></tr>
  <tr><td>HNSW</td><td>图索引，召回高、内存大</td></tr>
  <tr><td>IVF</td><td>倒排簇，快但需调 nprobe</td></tr>
  <tr><td>PQ</td><td>量化压缩，省内存</td></tr>
</table>

<h2>三、常见向量库</h2>
<ul>
  <li><b>Milvus / Qdrant / Weaviate</b>：专用向量数据库，生产级</li>
  <li><b>pgvector</b>：PostgreSQL 插件，复用现有库</li>
  <li><b>Faiss / Chroma</b>：轻量/本地原型</li>
</ul>
<pre><code># Qdrant 示例
client.upsert("docs", points=[PointStruct(id=1, vector=vec, payload={"text": t})])
client.search("docs", query_vector=vec, limit=5)</code></pre>
`,
  },
  {
    id: 'ai-deploy',
    title: '模型部署与推理优化',
    level: 'advanced',
    readMinutes: 17,
    tags: ['部署', '推理', '量化', 'GPU'],
    summary: '把大模型高效、低成本地部署到线上服务。',
    content: `
<h2>一、部署形态</h2>
<ul>
  <li><b>API 托管</b>：调用云端大模型 API（最快上手，按量付费）</li>
  <li><b>私有化部署</b>：自托管开源模型（Llama、Qwen 等），数据可控</li>
  <li><b>边缘/端侧</b>：小模型量化后跑在手机/嵌入式</li>
</ul>

<h2>二、推理优化手段</h2>
<ul>
  <li><b>量化</b>：FP16 → INT8/INT4，显存与速度显著改善（精度略降）</li>
  <li><b>KV Cache</b>：缓存注意力键值，避免重复计算</li>
  <li><b>批处理（Continuous Batching）</b>：合并多个请求提升吞吐</li>
  <li><b>推理框架</b>：vLLM（PagedAttention）、TensorRT-LLM、Ollama、llama.cpp</li>
</ul>

<h2>三、成本与监控</h2>
<p>关注 TTFT（首 token 延迟）、TPS（生成速度）、并发与显存占用。用 token 计费时要控制上下文长度，开启流式输出改善体感。</p>
<pre><code># vLLM 启动示例
python -m vllm.entrypoints.openai.api_server \\
  --model Qwen/Qwen2.5-7B --dtype auto --gpu-memory-utilization 0.9</code></pre>
`,
  },
];
