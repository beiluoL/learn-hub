---
question: DNS 域名解析的过程是怎样的？CDN 是如何加速的？
category: system
difficulty: middle
tags: "DNS, CDN, 域名解析, 缓存, GSLB"
order: 71
---

## DNS 解析与 CDN 加速

**核心结论**：DNS 通过递归查询将域名逐级解析为 IP 地址；CDN 通过 GSLB 智能调度将用户请求引导到最近的边缘节点，利用缓存命中减少回源。

---

### DNS 递归查询过程（文字时序）

以解析 www.example.com 为例：

```
客户端               本地DNS服务器                根DNS         .com顶级域DNS      example.com权威DNS
  |                      |                        |               |                  |
  |--① www.example.com-->>|                        |               |                  |
  |                      |--② 查询根域---------->>|               |                  |
  |                      |<<--③ 返回.com NS------|               |                  |
  |                      |--④ 查询.com----------------------->>|                  |
  |                      |<<--⑤ 返回example.com NS-----------|                  |
  |                      |--⑥ 查询www.example.com------------------------------>>|
  |<<----⑧ 返回 IP-------|<<--⑦ 返回 A 记录-----------------------------------|
  |                      |                        |               |                  |
```

**步骤详解**：

1. 客户端检查本地浏览器缓存 → 操作系统 hosts 文件 → 无记录，向本地 DNS 服务器发起递归查询。

2. 本地 DNS 服务器向根域名服务器查询，根返回 .com 顶级域 DNS 的 NS 记录和 IP（Glue Record）。

3. 本地 DNS 向 .com 顶级域 DNS 查询，返回 example.com 的权威 DNS 服务器地址。

4. 本地 DNS 向 example.com 权威 DNS 查询 www.example.com，返回该域名的 A 记录（IP 地址）。

5. 本地 DNS 将结果返回给客户端，并**缓存**该记录（TTL 时间内有效）。

---

### DNS 记录类型

| 记录类型 | 全称 | 用途 | 示例 |
|----------|------|------|------|
| A | Address | 域名 → IPv4 | www.example.com → 93.184.216.34 |
| AAAA | IPv6 Address | 域名 → IPv6 | www.example.com → 2606:2800:220:1:: |
| CNAME | Canonical Name | 域名别名 | www.example.com → example.com（再解析 A） |
| MX | Mail Exchange | 邮件服务器（含优先级） | example.com → mail.example.com 优先级10 |
| NS | Name Server | 指定域名由哪个 DNS 解析 | example.com → ns1.dnsprovider.com |
| TXT | Text | 验证信息、SPF 等 | v=spf1 include:_spf.google.com ~all |
| SRV | Service | 指定服务地址和端口 | _sip._tcp.example.com → sipserver:5060 |

---

### CDN 加速原理

**CDN（Content Delivery Network）** 是一组分布在全球各地的边缘缓存服务器，核心思路是将内容"推到"离用户最近的节点。

**工作流程**：

```
用户                     CDN 边缘节点              源站
  |                          |                      |
  |--① www.example.com/s.png->>                      |
  |                          | (检查缓存)              |
  |                          |--② 缓存未命中 ··· ···->>|
  |                          |<<--③ 返回文件··· ··· ·-|
  |<<--④ 返回 s.png---------| (缓存到本地)             |
  |                          |                      |
  |--⑤ 再次请求 s.png------->>                      |
  |<<--⑥ 命中缓存直接返回----|                      |
```

**关键技术组件**：

1. **GSLB（全局负载均衡）**：CDN 的"大脑"。用户请求域名，GSLB 基于以下策略返回最优边缘节点 IP：
   - 地理位置（就近访问）
   - 节点负载和健康状态
   - 运营商线路（电信/联通/移动）
   - 服务成本和计费策略

2. **边缘节点缓存**：文件到达边缘节点后按 TTL 缓存（常见为几分钟到几天）。缓存命中直接返回，命中率通常 >95%。

3. **回源**：缓存未命中或过期时的"兜底"——边缘节点向源站拉取最新文件，同时缓存一份。

---

### CDN 预热与刷新

**预热**：将指定 URL 提前加载到 CDN 边缘节点缓存中。适用于大促活动前提前推送静态资源（图片/视频/安装包），避免突发流量直接压到源站。

**刷新**：强制清除 CDN 边缘节点的缓存文件。源站更新文件后（如更新了 logo.png），需要刷新对应的 CDN 缓存，否则用户仍看到旧内容。刷新方式：
- URL 刷新：指定单个文件
- 目录刷新：指定目录下所有文件
- 正则刷新：按规则匹配刷新

---

### DNS 劫持与 HTTPDNS

**DNS 劫持**：攻击者或运营商篡改 DNS 查询的响应，将域名解析到恶意 IP。常见手段包括修改 hosts 文件、中间人篡改 DNS 响应包、运营商在 DNS 服务器上强制返回错误的 IP。

**HTTPDNS 方案**：绕过传统 DNS 协议，通过 HTTP 接口向特定的 DNS 服务器查询域名解析。

```javascript
// 伪代码：HTTPDNS 查询
const resp = await fetch(
  'https://dns.example.com/d?dn=www.target.com&ip=1.2.3.4'
);
const { ips, ttl } = await resp.json();
// 使用返回的 IP 直接建连，绕过运营商 DNS
```

**优势**：

1. 防止运营商劫持（走 HTTPS 加密通道）。
2. 跳过传统 DNS 的冗长递归链，延迟更低（一次 HTTP 往返）。
3. 可以根据客户端真实 IP 做精准调度。

---

### 面试官追问

**追问**：递归查询和迭代查询的区别？

**回答**：递归查询由本地 DNS 服务器"包办"——客户端只问一次，本地 DNS 代替它逐级查询到底。迭代查询是每级域名服务器只给"线索"不给结果——客户端需要自己逐个询问。用户到本地 DNS 通常是递归，本地 DNS 到其他服务器通常是迭代。递归对客户端简单但服务器压力大，迭代反之。

**追问**：CDN 如何处理动态内容（如 API 响应）？

**回答**：纯动态内容（如带用户 Cookie 的 API）无法缓存到 CDN 边缘。但 CDN 的回源通道可优化：通过 CDN 的智能路由选择最优回源路径，利用 CDN 到源站的长连接池和链路稳定优势，减少回源延迟。这称为"动态加速"或 DCDN。

**追问**：浏览器的 DNS 预解析是怎么做的？

**回答**：通过 `<link rel="dns-prefetch" href="//cdn.example.com">` 提示浏览器提前解析该域名，不阻塞主文档。浏览器在空闲时提前查 DNS 并将结果缓存，真正需要连接时直接使用已有 IP。对页面中跨域引用了第三方资源的性能提升非常明显。
