---
question: Nginx 的反向代理和负载均衡有哪些策略？常用的配置指令有哪些？
category: system
difficulty: middle
tags: "Nginx, 反向代理, 负载均衡, proxy_pass, upstream"
order: 83
---

## Nginx 反向代理与负载均衡

**核心结论**：Nginx 作为反向代理，核心功能是将客户端请求转发到后端服务器，并实现负载均衡、安全防护和内容缓存。upstream 配置后端节点池，proxy_pass 执行转发，location 定义路由规则。

---

### 正向代理 vs 反向代理

| 维度 | 正向代理 | 反向代理 |
|------|----------|----------|
| 代理对象 | 客户端 | 服务端 |
| 客户端感知 | 客户端明确知道代理地址 | 客户端认为访问的是目标服务器 |
| 典型场景 | 科学上网、企业内网上外网 | 负载均衡、安全防护、缓存加速 |
| 配置位置 | 客户端的浏览器/系统设置 | 服务端的 Nginx 配置 |
| 示例 | 用户在浏览器配置代理 127.0.0.1:7890 | DNS 解析到 Nginx，由其分发到后端集群 |

---

### 负载均衡策略

Nginx upstream 模块提供多种负载均衡算法：

**1. 轮询（默认）**：

```nginx
upstream backend {
    server 192.168.1.10:8080;
    server 192.168.1.11:8080;
    server 192.168.1.12:8080;
}
# 请求依次分配到 10 → 11 → 12 → 10...
```

**2. 加权轮询（weight）**：

```nginx
upstream backend {
    server 192.168.1.10:8080 weight=3;   # 权重 3，33% 流量
    server 192.168.1.11:8080 weight=1;   # 权重 1，17% 流量
}
# 按权重比例分配，适用于后端服务器性能不一致的场景
```

**3. IP 哈希（ip_hash）**：

```nginx
upstream backend {
    ip_hash;
    server 192.168.1.10:8080;
    server 192.168.1.11:8080;
}
# 同一客户端 IP 始终路由到同一台后端服务器
# 解决 Session 共享问题（不需要 Redis 集中存储 Session）
```

**4. 最小连接数（least_conn）**：

```nginx
upstream backend {
    least_conn;
    server 192.168.1.10:8080;
    server 192.168.1.11:8080;
}
# 请求分配到当前活跃连接数最少的服务器
# 适用于长连接场景（WebSocket、数据库代理）
```

**5. 通用哈希（hash）**：

```nginx
upstream backend {
    hash $request_uri consistent;   # consistent 开启一致性哈希
    server 192.168.1.10:8080;
    server 192.168.1.11:8080;
}
# 按请求 URL 哈希分配
# 常用于缓存代理——相同 URL 始终命中同一台服务器的缓存
```

**6. 最短响应时间（fair，需第三方模块）**：

按后端响应时间智能分配，响应快的服务器获得更多请求。

---

### 常用配置示例

```nginx
# 全局配置
worker_processes auto;           # 自动匹配 CPU 核心数
worker_connections 10240;        # 单 worker 最大连接数
use epoll;                       # Linux 下高性能事件模型

# HTTP 块
http {
    include       mime.types;
    default_type  application/octet-stream;

    # 性能优化
    sendfile        on;          # 零拷贝发送文件
    tcp_nopush      on;          # 减少网络包
    keepalive_timeout 65;

    # Gzip 压缩
    gzip            on;
    gzip_min_length 1024;
    gzip_types      text/plain application/json application/javascript text/css;
    gzip_comp_level 6;

    # 限流
    limit_req_zone $binary_remote_addr zone=mylimit:10m rate=10r/s;
    limit_conn_zone $binary_remote_addr zone=connlimit:10m;

    # 上游服务器组
    upstream api_cluster {
        least_conn;
        server 192.168.1.10:8080 weight=3 max_fails=3 fail_timeout=30s;
        server 192.168.1.11:8080 weight=2 max_fails=3 fail_timeout=30s;
        server 192.168.1.12:8080 backup;   # 备用节点，其他节点全挂才启用
    }

    # HTTPS 配置
    server {
        listen 443 ssl http2;
        server_name api.example.com;

        ssl_certificate     /etc/ssl/certs/server.crt;
        ssl_certificate_key /etc/ssl/private/server.key;
        ssl_protocols       TLSv1.2 TLSv1.3;
        ssl_ciphers         HIGH:!aNULL:!MD5;
        ssl_prefer_server_ciphers on;

        # 静态文件缓存
        location ~* \.(jpg|jpeg|png|gif|ico|css|js|woff2)$ {
            expires 30d;
            add_header Cache-Control "public, immutable";
        }

        # API 反向代理
        location /api/ {
            # 限流
            limit_req  zone=mylimit burst=20 nodelay;
            limit_conn connlimit 10;

            # 代理基本设置
            proxy_pass http://api_cluster;
            proxy_http_version 1.1;
            proxy_set_header Connection "";

            # 透传客户端真实信息
            proxy_set_header Host              $host;
            proxy_set_header X-Real-IP         $remote_addr;
            proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;

            # 超时设置
            proxy_connect_timeout 5s;
            proxy_send_timeout    30s;
            proxy_read_timeout    30s;

            # 缓冲
            proxy_buffering on;
            proxy_buffer_size 4k;
            proxy_buffers 8 16k;
        }

        # 健康检查端点（旁路代理）
        location /health {
            return 200 "OK";
        }
    }

    # HTTP → HTTPS 强制跳转
    server {
        listen 80;
        server_name api.example.com;
        return 301 https://$host$request_uri;
    }
}
```

---

### location 匹配规则

Nginx 的 `location` 指令按优先级匹配：

| 符号 | 含义 | 优先级 | 示例 |
|------|------|--------|------|
| `=` | 精确匹配 | 最高 | `location = /api/health` |
| `^~` | 前缀匹配（不检查正则） | 高 | `location ^~ /static/` |
| `~` | 区分大小写的正则匹配 | 中 | `location ~ \.php$` |
| `~*` | 不区分大小写的正则匹配 | 中 | `location ~* \.(jpg|png)$` |
| 无符号 | 普通前缀匹配 | 低（长路径优先） | `location /api/` |

匹配顺序：先检查精确匹配 (=) → 再检查前缀匹配（^~ 和无前缀，长路径优先）→ 最后按顺序检查正则匹配。

---

### Nginx vs LVS vs HAProxy

| 维度 | Nginx | LVS | HAProxy |
|------|-------|-----|---------|
| 工作层级 | 七层（HTTP/HTTPS）+ 四层 | 四层（TCP/UDP） | 七层 + 四层 |
| 性能 | 高（epoll 多进程） | 极高（内核态转发，零拷贝） | 高 |
| 功能 | 反向代理/静态文件/缓存/SSL/限流 | 仅负载均衡 | 负载均衡（算法丰富）/健康检查 |
| 适用协议 | HTTP/HTTPS/WebSocket/gRPC/TCP | TCP/UDP | HTTP/TCP |
| 典型架构位置 | 前端网关（接入层） | 最外层（四层负载分担给 Nginx 集群） | 四层或七层负载 |

**典型三层架构**：DNS → LVS（四层，转发给 Nginx 集群） → Nginx（七层，反向代理 + SSL 终结 + 静态资源） → 应用服务器（Tomcat/Node/Go）。

---

### 面试官追问

**追问**：Nginx 如何处理 WebSocket 代理？

**回答**：WebSocket 需要 Upgrade 机制，请求从 HTTP 升级为 WebSocket 协议。Nginx 需要显式设置 Upgrade 和 Connection 头部：

```nginx
location /ws/ {
    proxy_pass http://backend;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_read_timeout 3600s;   # WebSocket 长连接，超时需设长
}
```

**追问**：upstream 中 `max_fails` 和 `fail_timeout` 的作用？

**回答**：`max_fails=3 fail_timeout=30s` 表示在 30 秒内如果该后端节点失败 3 次（连接超时/拒绝/返回 5xx），则在接下来的 30 秒内将该节点标记为不可用（不再分配新请求）。超过 fail_timeout 后，Nginx 会试探性地发一个请求——如果成功，节点恢复可用；仍然失败，继续不可用。这是 Nginx 内置的被动健康检查机制。

**追问**：如何实现 Nginx 的平滑升级（不中断服务）？

**回答**：发送 USR2 信号给旧的 master 进程，Nginx 会 fork 新 master + worker，新旧两套进程同时运行（新 master 监听相同端口）。再发送 WINCH 信号给旧 master，旧 worker 优雅退出（处理完已有请求）。最后发送 QUIT 信号完全退出旧 master。整个过程用户无感知，连接不中断。这是 Nginx 相比其他 Web 服务器的一大优势。
