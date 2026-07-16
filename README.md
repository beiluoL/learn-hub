# LearnHub · 纯静态学习网站

一个**零后端**的学习网站，内容以 **Markdown / HTML 文件**维护，可直接部署到 **GitHub Pages**。
已内置 Java / Python / 前端 / AI 应用开发 的学习文章与面试题，你也可以轻松添加自己的内容。

## ✨ 特性

- **纯静态**：不需要任何服务器，所有内容就是仓库里的文件，构建后是一堆静态资源。
- **自带内容**：Java、Python、前端、AI 学习文章 + 精选面试题。
- **自己加内容**：往 `client/public/content/` 丢一个 `.md` 或 `.html` 文件即可，重新构建后自动出现。
- **一键部署**：推送到 GitHub，GitHub Actions 自动构建并发布到 Pages。
- **文章体验**：代码语法高亮、表格、标签、搜索、阅读时长，内容经安全消毒防 XSS。
- **学习路线**：每个分类页顶部有「学习路线」时间轴，按 入门 → 进阶 → 高级 把章节排成目录式时间轴，点哪章直接读。
- **知识图谱**：`/map` 页面提供类 Obsidian 的关系图谱——文章与面试题连成知识网，可拖拽、缩放、悬停高亮关联、点击打开。

## 📁 目录结构

```
.
├── server/data/                 # 种子内容（结构化 JS，首次构建转成 md 文件）
├── scripts/export-content.mjs   # 构建期脚本：生成 md + 扫描生成 manifest.json
├── client/
│   ├── public/content/          # ★ 你的学习内容都放这里
│   │   ├── categories.json      # 分类元数据（可手动编辑，如新增分类）
│   │   ├── manifest.json        # 自动生成，建议不要手改
│   │   ├── java/  python/  frontend/  ai/   # 各分类文章目录
│   │   └── interviews/          # 面试题目录
│   └── src/                     # React 前端（运行时加载内容，无后端）
└── .github/workflows/deploy.yml # Pages 自动部署工作流
```

## 📝 如何添加自己的内容

### 1. 添加文章

在 `client/public/content/<分类>/` 下新建 `.md` 文件，例如 `client/public/content/java/my-post.md`：

```markdown
---
title: 我的文章标题
category: java            # 必须是 categories.json 里的某个 id
level: 初级               # 初级 / 中级 / 高级（可选）
readMinutes: 8            # 预计阅读分钟（可选）
tags: [Java, 并发]         # 标签，用于搜索（可选）
summary: 一句话摘要，显示在列表与搜索结果里（可选）
order: 5                  # 同分类内排序，越小越靠前（可选）
---

# 正文标题

正文用 **Markdown** 书写，支持代码块、表格、列表、引用等。

\`\`\`java
for (int i = 0; i < 10; i++) {
    System.out.println(i);
}
\`\`\`
```

- `category` 必须是 `categories.json` 中已存在的 `id`（`java` / `python` / `frontend` / `ai`）。
- 想新增分类？编辑 `categories.json` 增加一项（含 `id` / `name` / `icon` / `color` / `desc`）。
- 文件保存后运行 `npm run gen` 重新生成 `manifest.json`，文章即出现在站点中。

### 2. 添加面试题

放在 `client/public/content/interviews/` 目录，用 `question` 作为标题字段：

```markdown
---
question: 什么是 RAG？它解决了大模型的哪些问题？
category: ai              # 所属技术分类（java/python/frontend/ai）
difficulty: middle        # easy / middle / hard
tags: [RAG, 大模型]
order: 1
---

答案正文，同样支持 Markdown / HTML 与代码高亮。
```

### 3. 添加 HTML 网页内容

直接放 `.html` 文件即可，例如 `client/public/content/java/my-page.html`。
内容会原样经安全消毒后渲染（`style` / `iframe` / `form` / `input` / `button` 已禁用以防止 XSS）。
frontmatter 写法与 `.md` 相同（用 `--- ... ---` 包裹在文件顶部）。

> 说明：`.md` 文件默认按 Markdown 解析；`.html` 文件默认按 HTML 解析。也可用 frontmatter 里的 `type: md` 或 `type: html` 显式指定。
> 文件的 `id` 由相对路径自动生成（不含扩展名），例如 `java/my-post.md` → 访问地址 `#/article/java/my-post`。

## 🛠 本地运行

```bash
# 安装依赖（根目录 + 前端）
npm install
cd client && npm install && cd ..

# 生成内容清单并启动开发服务器（带热更新）
npm run dev

# 仅重新生成 manifest（每次增删内容后运行一次）
npm run gen

# 构建静态产物到 client/dist
npm run build

# 本地预览构建结果
npm run preview
```

构建产物在 `client/dist`，可直接用任意静态服务器（如 `npx serve client/dist`）托管。

## 🚀 部署到 GitHub Pages

1. 把本仓库推送到 GitHub。
2. 进入仓库 **Settings → Pages → Build and deployment → Source**，选择 **GitHub Actions**。
3. 推送 `main` 分支（或到 **Actions** 标签页手动运行工作流）。

`.github/workflows/deploy.yml` 会自动完成：安装依赖 → `npm run gen` 重新生成清单 → 构建前端 → 部署到 Pages。
站点地址形如 `https://<你的用户名>.github.io/<仓库名>/`。

> 项目已设置 Vite `base: './'`，因此无需任何额外配置即可部署在仓库子路径下运行。

## 🔒 安全说明

所有用户内容（无论 md 还是 html）都会经过 `DOMPurify` 消毒，禁用 `style` / `iframe` / `form` / `input` / `button` 等危险标签，避免 XSS。

## 📦 技术栈

React 18 · Vite 5 · react-router-dom（HashRouter）· marked · DOMPurify · highlight.js
