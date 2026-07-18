# LearnHub · 零后端学习网站

一个**纯静态、可自托管**的学习网站：内容用 Markdown / HTML 维护，构建后是一堆静态资源，一键部署到 **GitHub Pages / Gitee Pages**。
内置 **Java / Python / 前端（含 React、Vue 系统学习路线）/ AI 应用开发** 的系列文章与精选面试题，并围绕「主动学习」做了进度追踪、计划生成、闪卡、随堂小测、在线运行等增强。

线上地址：https://beiluol.github.io/learn-hub/

## ✨ 核心特性

### 内容 & 学习路线
- **纯静态、零后端**：内容即仓库文件，构建即静态资源，任意静态服务器可托管。
- **自带内容**：Java / Python / 前端 / AI 文章 + 面试题（约 455 篇文章 / 83 道面试题）。
- **系统学习路线**：Vue 3 与 React 各有一套完整路线（总览打卡清单 + 9 章拆解 + 实战案例），按「入门 → 进阶 → 高级」排成时间轴。
- **知识图谱**（`/map`）：类 Obsidian 的关系图谱——文章与面试题连成知识网，可拖拽、缩放、悬停高亮关联、点击打开。
- **文章体验**：代码语法高亮、表格、标签、阅读时长、TOC 滚动高亮、上下篇导航、**代码块一键复制**、**标签可点击聚合**、**相关阅读推荐**。

### 主动学习 & 账号
- **账号（Supabase）**：邮箱注册 / 登录、GitHub OAuth、退出。
- **进度追踪**：标记「已学」、最近学习、按分类 / 模块统计。
- **学习计划生成器**：按你每天可用时间，把待学文章排成每日计划。
- **仪表盘 + 学习热力图**：可视化你的学习节奏。
- **笔记 & 闪卡**：文章内随手记笔记；知识点抽成闪卡做间隔复习。
- **随堂小测**：文章内嵌交互题（点击即判分 + 解析 + 进度 + 重做）。
- **智能推荐**：根据你的进度与标签推荐「下一篇」。

### 代码运行
- **文章内联「在线运行」**：JS（原生 ESM，`import` 自动走 esm.sh）/ Python（Pyodide WASM）/ HTML。
- **独立「在线运行」页（`/run`）**：类似 LeetCode / 菜鸟教程——JS / Python / HTML 切换、带行号编辑器、控制台输出。

### 工程化
- 暗色模式、PWA（可安装、离线缓存）。
- 搜索：标题 / 标签 / 正文 + 难度 × 重要度筛选。
- 安全：所有用户内容经 `DOMPurify` 消毒，禁用 `style` / `iframe` / `form` / `input` / `button` 等危险标签防 XSS。

## 🧱 技术栈

React 18 · Vite 5 · Tailwind CSS v4 · react-router-dom（HashRouter）· marked · DOMPurify · highlight.js · lucide-react · Supabase（账号 / 进度）· Pyodide（在线 Python）· esm.sh（在线 JS 依赖）

## 📁 目录结构

```
.
├── server/data/                 # 种子内容（结构化 JS：文章 / 面试题 / 分类）
├── scripts/export-content.mjs   # 构建期：把 server/data 导出为 .md + 扫描生成 manifest.json
├── client/
│   ├── public/content/          # 内容落地目录（gen 产出 + 你手写的 .md / .html）
│   │   ├── categories.json      # 分类元数据（自动生成，可手动编辑）
│   │   ├── manifest.json        # 自动生成（每次构建重算），建议不要手改
│   │   ├── java/ python/ frontend/ ai/ interviews/   # 各分类
│   │   └── frontend/{vue,react}/roadmap|cases/       # Vue / React 学习路线
│   └── src/                     # React 前端（运行时加载内容，无后端）
└── .github/workflows/deploy.yml # Pages 自动部署（gen + build）
```

## 📝 添加内容

内容有**两个来源**，构建期都会被纳入：

1. **种子内容**：编辑 `server/data/*.js`（结构化 JS），`npm run gen` 会把它导出为 `client/public/content/*.md` 并重建 `manifest.json`。
2. **独立内容**：直接在 `client/public/content/<分类>/` 丢一个 `.md` / `.html`，构建期自动扫描进 `manifest.json`。

### 文章 frontmatter（简单 `key: value`，**不要用 YAML 数组**）

```markdown
---
title: 标题
category: frontend            # 必须是 categories.json 里的某个 id
module: react                 # 子模块：vue / react（可选）
subcat: roadmap               # roadmap(路线) / cases(案例) / general(通用)
tier: core                    # basic/core/key/extend（重要度，默认 core）
level: beginner               # beginner/intermediate/advanced
readMinutes: 12
tags: "React, 学习路线, 路线图"        # 逗号分隔，不要用 [A, B]
summary: 一句话摘要，显示在列表与搜索结果里
order: 1
timeline: true                # 路线总览用时间轴渲染
prereq: frontend/react/roadmap/react-ch0-prebasic   # 前置文章完整 id，逗号分隔
---

# 正文标题

正文用 **Markdown** 书写，支持代码块、表格、列表、引用等。
```

> ⚠️ **`tags` / `prereq` 必须用逗号分隔的字符串**（如 `"React, 路线图"`），不要写成 `[React, 路线图]`——生成器按逗号拆分成数组。
> 文件的 `id` 由相对路径自动生成（不含扩展名），例如 `frontend/react/roadmap/react-ch1-core.md` → 访问地址 `#/article/frontend/react/roadmap/react-ch1-core`。

### 添加面试题

放在 `client/public/content/interviews/`，用 `question` 作为标题字段：

```markdown
---
question: 什么是 RAG？它解决了大模型的哪些问题？
category: ai              # java / python / frontend / ai
difficulty: middle        # easy / middle / hard
tags: "RAG, 大模型"
order: 1
---

答案正文，同样支持 Markdown / HTML 与代码高亮。
```

### 添加 HTML 网页内容

直接放 `.html` 文件即可。内容会原样经安全消毒后渲染（`style` / `iframe` / `form` / `input` / `button` 已禁用以防 XSS）。frontmatter 写法与 `.md` 相同。

## 🛠 本地运行

```bash
# 安装依赖（根目录 + 前端）
npm install
cd client && npm install && cd ..

# 生成内容清单 + 启动开发服务器（带热更新）
npm run dev

# 仅重新生成 manifest（每次增删种子内容后运行一次）
npm run gen

# 构建静态产物到 client/dist（含 gen）
npm run build

# 本地预览构建结果
npm run preview
```

构建产物在 `client/dist`，可直接用任意静态服务器（如 `npx serve client/dist`）托管。

## 🚀 部署

### GitHub Pages（主站）

1. 把本仓库推送到 GitHub（已配 `origin`，走 SSH）。
2. 进入仓库 **Settings → Pages → Build and deployment → Source**，选择 **GitHub Actions**。
3. 推送 `main` 分支即触发工作流：安装依赖 → `npm run gen` 重新生成清单 → 构建前端 → 部署到 Pages。

站点地址：`https://beiluol.github.io/learn-hub/`

> **密钥安全**：Supabase / Umami 等公开前端配置通过 **GitHub Actions Secrets**（`VITE_SUPABASE_URL` / `VITE_SUPABASE_PUBLISHABLE_KEY` / `VITE_UMAMI_ID` / `VITE_UMAMI_URL`）注入构建，`.env` 被 gitignore **不进仓库**。改值时同步更新仓库 Secrets，并改本地 `.env` 方便本地预览，**切勿把 `.env` 解除 gitignore 提交**。

### Gitee Pages（镜像）

1. 在 Gitee 新建同名仓库 `learn-hub`（`https://gitee.com/beiluol/learn-hub`），开启 Gitee Pages（或从 GitHub 导入）。
2. 添加远程并推送：

```bash
git remote add gitee git@gitee.com:beiluol/learn-hub.git
git push gitee main
```

> 本项目 `vite.config.js` 使用 `base: './'`（相对路径），因此**同时适配 GitHub Pages 与 Gitee Pages 子路径**，无需额外配置。

## 🔒 安全说明

- 所有用户内容（无论 md 还是 html）都会经过 `DOMPurify` 消毒，禁用 `style` / `iframe` / `form` / `input` / `button` 等危险标签，避免 XSS。
- 账号 / 进度走 Supabase，并启用 RLS 行级权限；密钥仅存于 GitHub Actions Secrets，**绝不入库**。

## 📦 常用脚本

| 命令 | 作用 |
| --- | --- |
| `npm run dev` | gen + 启动开发服务器 |
| `npm run gen` | 重新生成内容清单（manifest.json） |
| `npm run build` | gen + 构建静态产物到 `client/dist` |
| `npm run preview` | 本地预览构建结果 |
