---
question: OAuth2.0 的授权码流程是怎样的？SSO 单点登录如何实现？
category: system
difficulty: hard
tags: "OAuth2.0, SSO, 单点登录, 授权码, CAS"
order: 81
---

## OAuth2.0 授权码流程与 SSO 单点登录

**核心结论**：OAuth2.0 是授权协议（用户同意后，第三方应用获取授权），不是认证协议。SSO 是认证机制（一次登录，多处访问）。两者常结合使用——OAuth2.0 + OpenID Connect 实现认证和授权的统一方案。

---

### OAuth2.0 四种授权方式

| 授权方式 | 流程 | 适用场景 |
|----------|------|----------|
| 授权码（Authorization Code） | 前端获取 code → 后端用 code 换 token | **标准方式**，有后端的 Web 应用 |
| 隐式（Implicit） | 前端直接拿 token（无 code 交换步骤） | **已废弃**（OAuth 2.1 移除），SPA 不安全 |
| 密码（Resource Owner Password） | 用户直接提供用户名密码给应用 | 高度信任的内部应用 |
| 客户端凭证（Client Credentials） | 客户端用自己的身份获取 token | 服务间通信、自动化脚本 |

---

### 授权码流程（最完整的交互时序）

```
用户    客户端(前端)    客户端(后端)    授权服务器    资源服务器
 |          |              |              |            |
 |--①点击"GitHub登录"-->>|              |            |
 |          |--② 重定向至授权服务器------>>|            |
 |          |  (response_type=code,      |            |
 |          |   client_id, redirect_uri, |            |
 |          |   scope, state)            |            |
 |          |              |              |            |
 |<<--③显示登录/授权页面-----------------|            |
 |--④确认授权------------------------->>|            |
 |          |              |              |            |
 |          |<<--⑤ 重定向回 redirect_uri-|            |
 |          |  (code=abc123&state=xyz)    |            |
 |          |              |              |            |
 |          |--⑥ 将 code 发送给后端----->>|            |
 |          |              |--⑦ 用 code 换 token--->>|
 |          |              |  (grant_type=             |
 |          |              |   authorization_code,     |
 |          |              |   code, client_id,        |
 |          |              |   client_secret)          |
 |          |              |<<--⑧ 返回 access_token---|
 |          |              |  (可选 refresh_token)     |
 |          |              |              |            |
 |          |              |--⑨ 用 token 调 API------>>|
 |          |              |<<--⑩ 返回资源-------------|
 |          |<<--⑪ 返回登录成功-------------|           |
```

**步骤详解**：

1. **发起授权**：客户端前端重定向到授权服务器的 `/authorize` 端点。
   - `response_type=code`：请求授权码。
   - `client_id`：应用的唯一标识。
   - `redirect_uri`：回调地址（必须与注册时一致，防止恶意篡改）。
   - `scope`：请求的权限范围（如 `read:user user:email`）。
   - `state`：防 CSRF 的随机串（客户端生成，回传时校验）。

2. **用户授权**：用户在授权服务器页面上登录并同意授权。

3. **返回授权码**：授权服务器通过 HTTP 重定向将 `code` 发送回 `redirect_uri`。这是一个"一次性"的短期凭证（有效期通常 10 分钟，用完即废）。

4. **换取 Token**：后端收到 `code` 后，通过**后端信道**（不是浏览器）访问授权服务器的 `/token` 端点：
   - `grant_type=authorization_code`
   - `code` 授权码
   - `client_id` + `client_secret`（应用身份验证）

5. **返回 Token**：授权服务器返回 `access_token`（访问资源的凭证）和可选的 `refresh_token`。

**为什么 code 要经后端交换**：Security 的关键——`client_secret` 只在后端出现。如果前端直接换 token，需要暴露 `client_secret`，这在浏览器环境中不安全。`code` 通过前端 URL 传递，不携带 Secret，即使被日志或 Referer 泄露也无法单独使用（需要 Secret 才能换取 Token）。

---

### OAuth2.0 vs OpenID Connect

**OAuth2.0** 解决的是"我能做什么"（授权），返回 access_token。

**OpenID Connect（OIDC）** 在 OAuth2.0 基础上增加"你是谁"（认证），返回 id_token——一个包含用户信息的 JWT。OIDC 是 OAuth2.0 的扩展层。

| 比较 | OAuth2.0 | OpenID Connect |
|------|----------|----------------|
| 目的 | 授权第三方访问资源 | 认证用户身份 |
| 核心 Token | access_token | id_token (JWT) |
| 用户信息 | 需单独调用 /userinfo | id_token 内直接包含 |
| 应用场景 | API 授权、第三方登录 | 单点登录、身份验证 |

---

### SSO 单点登录原理

**核心思想**：统一认证中心（CAS Server）负责所有子系统的登录认证。用户只需登录一次，即可访问所有子系统。

**基于 JWT 的 SSO 流程**：

```
用户        应用 A        应用 B         SSO 认证中心
 |            |             |               |
 |--访问 A-->>|             |               |
 |            |--检查 Token--|               |
 |            |  无          |               |
 |            |--重定向----->>|               | (带 redirect_uri=A)
 |--重定向到 SSO 登录页------->>|               |
 |<<--登录页面-----------------|               |
 |--提交用户名密码------------>>|               |
 |                              | 验证通过，生成 JWT
 |                              | 设置 Cookie (sso.example.com 域)
 |<<--重定向回 A?token=JWT-----|               |
 |--带 Token 访问 A---------->>|               | (或者 Cookie 自动携带)
 |            |--验证 JWT------|               | (使用 SSO 公钥)
 |            |<<--返回页面-----|               |
 |            |             |               |
 |--访问 B---->>|             |               |
 |            |             |--检查 Token--|  |
 |            |             |  (Cookie 自动带)| 
 |            |             |--验证 JWT------| (使用 SSO 公钥)
 |            |             |<<--返回页面----|
```

**关键技术点**：

1. **统一域名/Cookie 共享**：所有子系统部署在同一父域下（如 `a.example.com`、`b.example.com`），Cookie Domain 设为 `.example.com`，任何一个子系统登录后 Cookie 在所有子域名下生效。配合 JWT/Token 通过 Cookie 传递实现单点登录。

2. **公钥验证**：SSO 中心用私钥签发 JWT，各子系统用公钥独立验证——无需每次都与 SSO 中心通信。

3. **单点登出（SLO）**：用户在一个系统登出，所有系统同时登出。实现方式：认证中心维护已注销的 Token 黑名单 + 主动通知各子系统清理会话。

---

### CAS 协议

CAS 是经典的 SSO 协议，由耶鲁大学开发，定义了三方交互流程（浏览器、CAS Server、CAS Client）。

```
关键票据：
TGT (Ticket Granting Ticket)    = Cookie 中的登录态，类似 Session
ST  (Service Ticket)            = 一次性凭证，用于子系统验证用户
```

CAS 流程：用户访问应用 A → 无 Cookie → 重定向到 CAS Server → CAS 发现无 TGT → 显示登录页 → 登录成功后创建 TGT（Set-Cookie）+ 生成 ST → 重定向回 A 的地址携带 ST → A 的后端用 ST 去 CAS Server 验证 → CAS 返回用户信息 → 登录成功。

---

### 面试官追问

**追问**：OAuth2.0 的 state 参数是干什么的？

**回答**：防止 CSRF 攻击。攻击者诱导用户点击一个链接，该链接直接调用授权服务器端点并携带攻击者自己预先准备好的授权码。如果用户未察觉完成授权过程，用户的账号会绑定到攻击者的授权码上，导致攻击者可以操作用户的资源。state 参数是客户端生成的随机串，授权服务器原样回传。客户端收到后校验 state 是否与自己生成的一致——如果不一致，拒绝处理。

**追问**：SSO 中如何解决跨域 Cookie 无法共享的问题？

**回答**：当子系统不在同一个域名下时（如 `app-a.com` 和 `app-b.com`），Cookie 无法跨域。解决方案：1) SSO 中心统一回调——子系统 A 跳转到 `sso.example.com?redirect=https://app-a.com`，登录后带 Token 回调 A，A 将 Token 写入自己的 Cookie 或 LocalStorage。2) OIDC 模式——每个子系统独立与认证中心建立会话，认证中心记住用户，子系统通过 iframe 刷新或前端发请求续自己的 Token。3) 共享二级域名——要求所有子系统部署到 `*.example.com` 下，Cookie Domain 设为 `.example.com`。

**追问**：access_token 和 id_token 有什么区别？

**回答**：access_token 给资源服务器看，证明"我有权限访问这个 API"——格式不固定（可以是 JWT，也可以是随机字符串/opaque token）。id_token 给客户端看，证明"我是谁"——格式必须是 JWT，包含 `sub`（用户 ID）、`iss`（签发方）、`aud`（接收方）、`exp`（过期时间）等声明。id_token 不能用于访问 API，access_token 不应被客户端解析内容（对客户端是不透明的凭证）。
