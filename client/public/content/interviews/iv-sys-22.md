---
question: Docker 镜像、容器、仓库的区别？Dockerfile 的常用指令有哪些？
category: system
difficulty: middle
tags: "Docker, 容器化, Dockerfile, 镜像分层"
order: 77
---

## Docker 镜像、容器、仓库与 Dockerfile

**核心结论**：镜像是只读模板（构建产物），容器是镜像的运行实例（镜像 + 读写层），仓库是镜像的存储分发中心。docker build 构建镜像，docker run 从镜像创建容器，docker push/pull 向仓库推送/拉取。

---

### 镜像、容器、仓库三者的关系

```
            docker build         docker run
Dockerfile ─────────────→ 镜像 ────────────→ 容器
                              ↑       ↓
                              │  docker push / pull
                              ↓       ↑
                            Registry（仓库）
```

**镜像**：轻量、独立、可执行的软件包，包含运行应用所需的全部内容——代码、运行时、系统工具、系统库和配置。基于 **Union FS**（如 OverlayFS）的分层架构，每一层是一个文件系统快照。多个镜像可以共享相同的底层（如 ubuntu:22.04），节省磁盘和网络带宽。

```bash
# 查看镜像分层
docker image history nginx:alpine
# 输出每一层的 ID、创建命令、大小
```

**容器**：镜像的运行实例。本质是镜像的只读层上方叠加一个可读写层（Container Layer）。同一个镜像可以启动多个相互隔离的容器，每个容器的写入只影响自己的可读写层，不影响镜像和其他容器。

**仓库**：集中存放镜像的远程服务器。默认是 Docker Hub。格式：`[registry/][namespace/]image[:tag]`。示例：`registry.cn-hangzhou.aliyuncs.com/myns/myapp:v2.0`。

---

### Dockerfile 常用指令

```dockerfile
# FROM：指定基础镜像，必须为第一条指令
FROM node:18-alpine AS builder

# WORKDIR：设置工作目录（后续指令在此执行）
WORKDIR /app

# COPY：从构建上下文复制文件到镜像（推荐，简单复制）
COPY package.json yarn.lock ./

# RUN：在镜像构建时执行命令（每层 RUN 生成一层镜像）
RUN yarn install --frozen-lockfile --production

# 多阶段构建：第一阶段编译，第二阶段只复制产物
FROM node:18-alpine
WORKDIR /app

# COPY --from：从其他阶段复制文件
COPY --from=builder /app/node_modules ./node_modules
COPY . .

# ADD：高级 COPY，支持 URL 下载和自动解压 tar 文件
ADD https://example.com/config.tar.gz /etc/config/

# ENV：设置环境变量（运行时生效）
ENV NODE_ENV=production \
    PORT=3000

# EXPOSE：声明容器监听端口（文档作用，实际不用 -p 同时指定的话不生效）
EXPOSE 3000

# CMD：容器启动时的默认命令（可被 docker run 后的命令覆盖）
CMD ["node", "server.js"]

# ENTRYPOINT：容器入口点（不会被覆盖，用于封装工具类容器）
ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["--help"]  # CMD 作为 ENTRYPOINT 的默认参数

# USER：切换运行用户（安全最佳实践）
USER node

# VOLUME：声明匿名挂载点（真正常驻数据用 -v 显式挂载）
VOLUME ["/data"]

# HEALTHCHECK：容器健康检查
HEALTHCHECK --interval=30s --timeout=3s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1
```

---

### 关键指令对比

**COPY vs ADD**：
| 指令 | 用途 | 何时用 |
|------|------|--------|
| COPY | 从构建上下文复制文件 | **推荐**，99% 的场景够用 |
| ADD | COPY + URL 下载 + 自动解压 tar | 需要自动解压 tar 包时 |

最佳实践：优先使用 COPY。ADD 的自动解压行为可能导致非预期结果。

**CMD vs ENTRYPOINT**：

| 指令 | 行为 | 可被覆盖 |
|------|------|----------|
| CMD | 默认命令和参数 | `docker run <image> <cmd>` 覆盖 |
| ENTRYPOINT | 固定入口 + CMD 提供默认参数 | `docker run --entrypoint` 覆盖 |

典型组合：
```dockerfile
ENTRYPOINT ["python"]
CMD ["app.py"]
# docker run myimage          → python app.py
# docker run myimage test.py  → python test.py
```

---

### 多阶段构建

**问题**：编译依赖和运行依赖混在一起，镜像体积巨大。Go 程序编译时需要 GCC 和数千个头文件，运行时只需要一个二进制文件。

```dockerfile
# 阶段一：构建
FROM golang:1.21-alpine AS builder
WORKDIR /src
COPY . .
RUN CGO_ENABLED=0 go build -o /app .

# 阶段二：运行
FROM alpine:3.19
COPY --from=builder /app /app
CMD ["/app"]
# 最终镜像：仅 alpine 基础 + 二进制文件 ≈ 10MB
# 如果不用多阶段：golang 镜像 ≈ 400MB+
```

---

### RUN 缓存利用

Docker 构建时按层缓存。每条指令生成一层。将**不变的上层、变化的下层**放在前面以最大化缓存命中率：

```dockerfile
# 好的写法（变更频繁的 COPY 放最后）
COPY package.json yarn.lock ./
RUN yarn install
COPY . .                    # ← 代码经常变

# 差的写法（每次代码变更都会让 yarn install 重新执行）
COPY . .
RUN yarn install            # ← 每次都重跑，因为上面 COPY 变了
```

---

### docker-compose 示例

```yaml
version: "3.8"
services:
  api:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DB_HOST=database
      - NODE_ENV=production
    depends_on:
      - database
      - redis
    restart: unless-stopped

  database:
    image: postgres:16-alpine
    volumes:
      - pgdata:/var/lib/postgresql/data
    environment:
      POSTGRES_USER: app
      POSTGRES_PASSWORD: ${DB_PASSWORD}

  redis:
    image: redis:7-alpine

volumes:
  pgdata:
```

---

### 面试官追问

**追问**：镜像的 Union FS 当多个容器写同一个文件时怎么处理？

**回答**：每个容器拥有独立的可读写层。修改镜像层中的文件时，使用 **Copy on Write（COW）** 机制——将文件从下层只读层复制到容器自身的可读写层，修改发生在副本上。同一镜像的不同容器各自维护自己的 COW 层，互不影响。

**追问**：如何减小 Docker 镜像体积？

**回答**：
1. 使用多阶段构建（构建与运行分离）。
2. 选择精简基础镜像（alpine 版比 debian 版小 ~5 倍，distroless 更安全更小）。
3. 将多个 RUN 合并到单条指令（减少层数）：`RUN apt update && apt install -y pkg && rm -rf /var/lib/apt/lists/*`。
4. 添加 `.dockerignore` 排除不需要的文件（node_modules/、.git/、构建产物）。
5. 安装包时及时清理缓存（`yarn cache clean`、`pip cache purge`）。
