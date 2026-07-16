---
question: CI/CD 是什么？你用过哪些 CI/CD 工具？一条完整的 Pipeline 包含哪些阶段？
category: system
difficulty: middle
tags: "CI/CD, Jenkins, GitHub Actions, DevOps"
order: 79
---

## CI/CD 概念与 Pipeline 设计

**核心结论**：CI（持续集成）确保代码频繁合并后能自动构建和测试，CD（持续交付/部署）确保代码变更能自动、安全、快速地到达生产环境。二者的共同目标是将"集成地狱"和"发布恐惧"转化为可靠的自动化流程。

---

### CI 持续集成

开发者频繁（每天多次）将代码合并到主干分支。每次合并触发自动化构建和测试。

**典型 CI 流程**：

```
开发者 push 代码 → 触发 Webhook
                        ↓
              ┌─────────────────────┐
              │  1. 拉取代码 (checkout) │
              │  2. 编译 (build)      │
              │  3. 单元测试 (unit test)│
              │  4. 代码扫描 (lint/sonar)│
              │  5. 构建制品 (artifact)  │
              └──────────┬──────────┘
                         ↓
                  ┌──────┴──────┐
                  │   结果反馈    │
                  │  (Slack/邮件)│
                  └─────────────┘
```

**CI 解决的问题**：多人并行开发时，各自的分支长期不合并，最终合并时产生大量冲突，修复冲突的成本和工作量巨大。CI 将"大爆炸式集成"拆散为每日的小集成。

---

### CD 持续交付 vs 持续部署

| 概念 | 定义 | 人工审批 |
|------|------|----------|
| 持续交付 | 代码变更自动通过测试，但部署到生产环境需要人工批准 | 有 |
| 持续部署 | 只要通过全部测试，自动部署到生产，无需人工干预 | 无 |

多数团队采用持续交付——代码自动验证，但点击"发布"由人来决策。

---

### 完整 Pipeline 阶段

```
┌────────────────────────────────────────────────────┐
│ 1. Checkout    拉取代码 + 触发分支匹配                │
├────────────────────────────────────────────────────┤
│ 2. Compile     编译（Java/Maven、Go、Rust 等）       │
│                前端：npm install + npm run build     │
├────────────────────────────────────────────────────┤
│ 3. Unit Test   单元测试 + 覆盖率报告                  │
│                覆盖率不达标 → 阻断 Pipeline            │
├────────────────────────────────────────────────────┤
│ 4. Static Scan SonarQube / ESLint / Checkstyle 静态分析│
│                ShellCheck 校验脚本                   │
├────────────────────────────────────────────────────┤
│ 5. Build Image docker build + tag（git SHA / 版本号）│
│                容器镜像安全扫描（Trivy）               │
├────────────────────────────────────────────────────┤
│ 6. Push Repo   推送镜像到 Registry（Harbor / ECR）    │
│                推送 Helm Chart / K8s Manifest        │
├────────────────────────────────────────────────────┤
│ 7. Deploy      部署到目标环境（dev / staging / prod）  │
│                灰度发布 / 金丝雀 / 蓝绿切换            │
├────────────────────────────────────────────────────┤
│ 8. Smoke Test  冒烟测试——部署后验证核心接口正常        │
│                健康检查 / 关键 API 调用 / 日志校验     │
├────────────────────────────────────────────────────┤
│ 9. Notify      通知结果（企业微信/Slack/钉钉/邮件）    │
└────────────────────────────────────────────────────┘
```

**门禁条件**：

- 单测覆盖率 < 80%：Pipeline 阻断。
- SonarQube 新增 Critical Bug：阻断。
- 镜像安全扫描发现高危漏洞（Critical/High）：阻断。
- 冒烟测试失败：自动回滚。

---

### GitHub Actions 示例

```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test-and-build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      # 编译
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: "npm"

      - name: Install dependencies
        run: npm ci

      # 代码检查
      - name: Lint
        run: npm run lint

      # 单元测试
      - name: Unit Test
        run: npm test -- --coverage

      # 构建 Docker 镜像
      - name: Build Docker Image
        run: |
          docker build -t myapp:${{ github.sha }} .
          docker tag myapp:${{ github.sha }} registry.example.com/myapp:${{ github.sha }}

      # 推送镜像
      - name: Push to Registry
        run: docker push registry.example.com/myapp:${{ github.sha }}

  deploy:
    needs: test-and-build
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to K8s
        run: |
          kubectl set image deployment/api app=registry.example.com/myapp:${{ github.sha }}
          kubectl rollout status deployment/api
```

---

### 部署策略对比

| 策略 | 原理 | 回滚速度 | 资源成本 | 适用场景 |
|------|------|----------|----------|----------|
| 滚动更新 | 逐个替换旧实例，新旧版本短暂共存 | 中等 | 低 | 通用场景 |
| 蓝绿部署 | 维护两套完整环境，切换流量入口 | 极快（切流量） | 高（双倍资源） | 高风险/核心服务 |
| 金丝雀发布 | 新版本放少量流量，验证后逐步放量 | 快（撤回金丝雀） | 低 | 需要验证真实流量的场景 |
| A/B 测试 | 按用户分流，对比不同版本的效果 | 快 | 中 | 产品实验、功能验证 |

**滚动更新**（Deployment 默认）：maxSurge 个新 Pod 启动 → maxUnavailable 个旧 Pod 停止 → 循环直到全部替换。优势是资源利用率高，缺点是回滚需要等待逐个恢复。

**蓝绿部署**：同时维护"蓝"（旧版本）和"绿"（新版本）两套完整环境。切换只需修改 Load Balancer / Service Selector 指向。优势是回滚秒级完成，代价是需要双倍基础设施资源。

**金丝雀发布**：新版本部署少量 Pod（如 5%），只有部分用户命中新版本。监控指标（错误率、延迟、CPU）无异常后逐步增加比例。K8s 上通常通过 Istio/Argo Rollouts 实现细粒度流量控制。

---

### 面试官追问

**追问**：Jenkins Pipeline 的 Scripted Pipeline 和 Declarative Pipeline 有什么区别？

**回答**：Declarative Pipeline 是结构化声明（必须用 pipeline{} 块包裹，章节清晰——agent、stages、steps、post），简洁易读，适合大多数标准场景。Scripted Pipeline 是 Groovy 脚本，灵活度极高，可以写任意条件和循环，但可读性差、易出错。推荐 Declarative，只在复杂动态编排场景下使用 Scripted。

**追问**：如何处理 Pipeline 中不同的环境（dev/staging/prod）？

**回答**：
1. 多分支策略（Git Flow）：不同分支触发不同环境（develop → dev、main → staging/prod）。
2. 环境变量注入：通过 CI/CD 平台的环境变量（GitHub Environments、Jenkins 参数化构建）注入不同配置。
3. GitOps：将环境配置与代码分开管理——K8s manifest 存在独立的配置仓库中，ArgoCD 自动同步。

**追问**：Pipeline 中的制品（Artifact）如何管理版本策略？

**回答**：三种常见策略：1) Git Commit SHA（`${CI_COMMIT_SHORT_SHA}`）——可追溯源码、短小、唯一；2) 语义化版本（`1.2.3-build.42`）——语义明确，结合 Git Tag 使用；3) 时间戳混合（`20240716153020-abc123`）——按时间排序，适用于快速迭代。Docker 镜像通常同时打 commit SHA 和语义标签两个 tag。
