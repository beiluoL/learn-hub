---
question: Git rebase 和 merge 有什么区别？Git Flow 工作流是怎样的？
category: system
difficulty: middle
tags: "Git, rebase, merge, Git Flow, 分支管理"
order: 82
---

## Git rebase vs merge 与 Git Flow 工作流

**核心结论**：merge 保留完整历史（产生 merge commit），rebase 线性化历史（重写提交点）。选择标准——公共分支用 merge 保留历史，个人分支用 rebase 保持整洁。Git Flow 是经典的分支管理模型，适合有固定发版周期的团队。

---

### merge vs rebase

**merge（三方合并）**：

```
# 在 feature 分支上
git checkout main
git merge feature

合并前：
main:    A---B---C
              \
feature:       D---E

合并后（产生 merge commit M）：
main:    A---B---C---M
              \     /
feature:       D---E
```

产生一个新的合并提交，保留所有历史记录和分支分叉信息。历史图是非线性的（有分叉和合并）。

**rebase（变基）**：

```
# 在 feature 分支上
git checkout feature
git rebase main

变基前：
main:    A---B---C
              \
feature:       D---E

变基后（D 和 E 被"移植"到 C 之后）：
main:    A---B---C
                  \
feature:           D'---E'
```

D 和 E 被重放到 C 之后——实际上创建了新的提交 D' 和 E'（提交哈希变化）。历史变成一条直线，无分叉记录。

---

### merge vs rebase 对比

| 维度 | merge | rebase |
|------|-------|--------|
| 历史形状 | 分叉 + 合并，非线性 | 线性，一条直线 |
| 提交记录 | 保留所有原始提交 + 合并提交 | 生成新提交（哈希变化） |
| 冲突处理 | 仅合并时处理一次 | 每次重放都可能需要处理冲突 |
| 追溯性 | 高（能看到何时从哪个分支合并） | 中（看不到原始分支信息） |
| 团队协作 | 安全，适合公共分支 | **黄金规则：绝不 rebase 已推送的公共分支** |
| 适用场景 | 公共分支合并、PR/MR 归档 | 个人分支同步最新主干、提交历史整理 |

**rebase 的黄金规则**：永远不要 rebase 已经推送到远程仓库的公共分支。因为 rebase 会改写提交历史（哈希重新计算），其他人基于旧的提交开发会导致灾难性冲突——他们拉取时出现偏离（diverged），被迫用 force push 解决。

**正确的 rebase 使用方式**：

```bash
# 场景：从 main 拉取最新代码，保持 feature 分支干净
git checkout feature
git pull --rebase origin main   # 等价于 fetch + rebase

# 场景：合并多个脏提交为一个整洁的提交
git rebase -i HEAD~3
# 交互式编辑：pick + squash + reword
```

---

### 解决冲突流程

```bash
# 场景：rebase 过程中遇到冲突
git rebase main
# CONFLICT (content): Merge conflict in src/app.js

# 步骤 1：编辑文件解决冲突
vim src/app.js

# 步骤 2：标记已解决
git add src/app.js

# 步骤 3：继续 rebase
git rebase --continue

# 如果中途想放弃
git rebase --abort
```

**冲突标记含义**：

```
<<<<<<< HEAD          ← 当前 base 的内容（main 分支）
const port = 3000;
=======               ← 分隔线
const port = 8080;
>>>>>>> feature       ← feature 分支的内容
```

---

### Git Flow 工作流

Git Flow 定义了严格的分支模型，适用于有计划发版周期的项目。

```
分支结构：
master (main)
  ├── hotfix/*        ← 线上紧急修复分支
  │      ├── 从 master 切出
  │      └── 合并到 master + develop
  │
  ├── release/*       ← 发版准备分支
  │      ├── 从 develop 切出
  │      └── 合并到 master + develop（打 tag）
  │
  └── develop         ← 开发主干
         ├── feature/*  ← 功能开发分支
         │      ├── 从 develop 切出
         │      └── 合并回 develop
         │
         └── 继续集成
```

**分支职责**：

| 分支 | 用途 | 生命周期 | 合并目标 |
|------|------|----------|----------|
| master/main | 线上运行代码，只读保护 | 永久 | 不接受直接提交 |
| develop | 开发主干，所有 feature 汇入 | 永久 | 不接受直接提交 |
| feature/* | 单个功能开发 | 功能开发完毕删除 | develop |
| release/* | 发版前测试和 bug 修复 | 发版后删除 | master + develop |
| hotfix/* | 线上紧急 bug 修复 | 修复后删除 | master + develop |

---

### GitHub Flow（简化版）

Git Flow 对于持续交付团队过于复杂。GitHub Flow 是简化模型：

```
main (始终可部署)
  ├── feature-branch-1  → PR → 代码审查 → 合并 → 部署
  ├── feature-branch-2  → PR → 代码审查 → 合并 → 部署
  └── feature-branch-3  → PR → 代码审查 → 合并 → 部署
```

特点：只有 main 一个长期分支，所有功能通过 Pull Request 提交，合并后立即部署。适合每日多次发布的高频团队。

---

### 面试官追问

**追问**：`git reset` 和 `git revert` 有什么区别？

**回答**：`git reset` 是"回退指针"——丢弃提交（--soft 保留修改在暂存区、--mixed 保留在工作区、--hard 完全丢弃）。`git revert` 是"创建一个反向提交"——生成一个新提交，内容为撤销目标提交的修改。reset 改写历史（危险，不适合公共分支），revert 追加历史（安全，适合公共分支）。

**追问**：`git merge --squash` 做了什么？

**回答**：将一个分支的所有提交压缩为一次变更，然后作为一次提交合并到目标分支（不保留原始 commit 记录和分支关联）。用于功能分支上有很多细小提交，希望合并时变成一次清晰的提交。与 rebase -i squash 的区别：squash merge 不创建合并提交，且被 merge 的分支历史不进入主线。

**追问**：`.git/index` 文件的作用？

**回答**：Git 的索引（也叫暂存区）是一个二进制文件，存储了即将进入下一次提交的文件列表和其内容哈希。`git add` 将工作区的文件写入 index；`git commit` 将 index 中的内容创建为新的 commit 对象。Index 是工作区和版本库之间的中间层，`git diff`（工作区 vs index）、`git diff --cached`（index vs HEAD）都是与 index 进行比较。
