---
question: HTTP/1.1、HTTP/2、HTTP/3 有什么区别？HTTP/2 的多路复用是如何实现的？
category: system
difficulty: hard
tags: "HTTP, HTTP2, HTTP3, 多路复用, QUIC"
order: 69
---

## HTTP/1.1、HTTP/2、HTTP/3 区别

**核心结论**：HTTP/1.1 是串行文本协议，HTTP/2 引入二进制分帧和 Stream 多路复用解决应用层队头阻塞，HTTP/3 基于 QUIC（UDP）彻底消除 TCP 层的队头阻塞。三者反映的是 Web 协议从文本到二进制、从串行到并行的演进路径。

---

### HTTP/1.1 特点与局限

**改进（相对于 HTTP/1.0）**：

1. **Keep-Alive 持久连接**：通过 `Connection: keep-alive` 头部复用 TCP 连接，避免每个请求都重新握手。
2. **管线化（Pipelining）**：可以在不等待上一个响应的情况下连续发送请求。
3. **Host 头部**：支持同一 IP 部署多个虚拟主机。

**队头阻塞（Head of Line Blocking）**：HTTP/1.1 要求响应按请求顺序返回。如果第一个请求处理缓慢（如大文件下载），后续请求的响应必须等待——这就是队头阻塞。管线化只是让请求可以批量发出，并未解决响应排队的问题。

**并发连接**：浏览器通过建立多个 TCP 连接（通常 6 个/域名）来缓解串行问题，但这又引入连接开销和资源竞争。

---

### HTTP/2：二进制分帧与多路复用

HTTP/2 的核心革新是**二进制分帧层**。

**工作原理**：

1. **帧（Frame）**：HTTP/2 的最小通信单位，包含帧头（9 字节）+ 帧负载。帧头记录了帧类型、所属 Stream ID 和长度。

2. **消息（Message）**：一个完整的 HTTP 请求或响应，由多个帧组成（如 HEADERS 帧 + DATA 帧）。

3. **流（Stream）**：一条 TCP 连接上的虚拟信道，每个 Stream 有唯一标识符（奇数由客户端发起，偶数由服务端发起）。多个 Stream 的帧可以在同一条 TCP 连接上交错发送，接收端按 Stream ID 组装。

**多路复用工作方式**：

```
TCP 连接
├── Stream 1 (HEADERS: GET /index.html)
├── Stream 3 (HEADERS: GET /style.css)
├── Stream 5 (HEADERS: GET /app.js)
│
发送时的帧交错：
[Stream1.HEADERS] [Stream3.HEADERS] [Stream5.HEADERS] [Stream3.DATA] [Stream1.DATA] [Stream5.DATA]
```

接收端根据帧头的 Stream ID 重新组装，各 Stream 完全独立，互不阻塞。

**其他重要特性**：

- **HPACK 头部压缩**：静态字典（61 个预定义头部）+ 动态字典（增量更新），显著减少冗余头部传输。
- **Server Push**：服务端可以主动推送资源（如推送 CSS/JS），减少客户端等待时间。
- **流优先级**：客户端可设置 Stream 优先级，服务端据此分配带宽。
- **流控**：基于 Stream 和连接两级流量控制。

**HTTP/2 的队头阻塞**：HTTP/2 仍然运行在 TCP 之上。TCP 是字节流协议，要求数据严格按序交付。如果一个 TCP 包丢失，即使后续包已到达，也必须等待丢失包重传——这就是 TCP 层的队头阻塞，HTTP/2 的多路复用无法解决。

---

### HTTP/3：QUIC 与彻底摆脱队头阻塞

HTTP/3 不再使用 TCP，而是基于 **QUIC**（Quick UDP Internet Connections）协议，运行在 UDP 之上。

**QUIC 关键特性**：

1. **0-RTT 握手**：已连接过的客户端可以"零往返"建立连接。首次 1-RTT（交换密钥和参数合并到一个往返），再次连接 0-RTT（直接发送数据）。

2. **无 TCP 队头阻塞**：QUIC 在 UDP 之上实现了类似 TCP 的可靠传输，但流之间完全独立。一个流丢包只影响该流本身，其他流不受影响。

3. **连接迁移**：基于 Connection ID 而非 IP + 端口标识连接。切换网络（WiFi 到 4G）时不需要重新握手。

4. **内置 TLS 1.3**：加密是 QUIC 的强制组件，不需要单独协商。

---

### 对比表格

| 维度 | HTTP/1.1 | HTTP/2 | HTTP/3 |
|------|----------|--------|--------|
| 传输层 | TCP | TCP | QUIC (UDP) |
| 格式 | 文本 | 二进制帧 | 二进制帧 |
| 多路复用 | 无（管线化不完整） | Stream 多路复用 | Stream 多路复用 |
| 队头阻塞 | 应用层 | TCP 层存在 | 无 |
| 头部压缩 | 无 | HPACK | QPACK |
| 连接建立 | 1 RTT + TLS 4~6 RTT | 1 RTT + TLS 2~3 RTT | 1-RTT / 0-RTT |
| Server Push | 无 | 有 | 有 |
| 连接迁移 | 不支持 | 不支持 | 支持 |
| 普及度 | 基本淘汰 | 当前主流 | 增长中 |

---

### Nginx 开启 HTTP/2 配置

```nginx
server {
    listen 443 ssl http2;   # 关键：http2 参数
    server_name example.com;

    ssl_certificate     /etc/ssl/certs/server.crt;
    ssl_certificate_key /etc/ssl/private/server.key;
    ssl_protocols       TLSv1.2 TLSv1.3;
    ssl_ciphers         HIGH:!aNULL:!MD5;

    # 启用 Server Push（HTTP/2）
    location / {
        http2_push /css/style.css;
        http2_push /js/app.js;
        proxy_pass http://backend;
    }
}
```

---

### 面试官追问

**追问**：HTTP/2 的 Server Push 为什么实际中不太用了？

**回答**：Server Push 容易出现推送资源的浏览器缓存"新鲜度"问题——服务端不知道浏览器是否已有缓存，可能重复推送浪费带宽。Chrome 106+ 已弃用 Server Push，推荐使用 `<link rel="preload">` 和 103 Early Hints 替代。

**追问**：为什么 HTTP/3 要用 UDP 而不是直接改造 TCP？

**回答**：TCP 实现在操作系统内核中，协议栈升级涉及大量设备的操作系统更新，周期极长（HTTP/2 推广用了近 10 年）。UDP 是轻量级封装，QUIC 跑在用户态，可以随应用更新而演进，迭代速度快得多。

**追问**：gRPC 为什么选择 HTTP/2？

**回答**：gRPC 需要双向流（Bidirectional Streaming），即在同一个 TCP 连接上同时发送请求和接收响应。HTTP/2 的 Stream 支持全双工，天然适合 gRPC 的四类调用方式（一元、服务端流、客户端流、双向流）。
