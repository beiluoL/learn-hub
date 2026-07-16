---
question: JWT 的原理和结构是什么？与传统的 Session 认证有什么区别？
category: system
difficulty: middle
tags: "JWT, Session, 认证, Token, 无状态"
order: 80
---

## JWT 原理与 Session 对比

**核心结论**：JWT 是无状态 Token，认证状态编码在 Token 本身，服务端不存储；Session 是有状态认证，服务端维护会话数据，客户端只携带 SessionId。JWT 天然适合分布式系统，Session 更易进行主动控制和权限撤销。

---

### JWT 结构

JWT 由三段 Base64URL 编码串组成，用 `.` 分隔：

```
eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIn0.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c
|--------- Header ---------|---------------- Payload ----------------|--------------- Signature ----------------|
```

**Header**（算法声明）：

```json
{
  "alg": "HS256",
  "typ": "JWT"
}
```

**Payload**（声明数据）：

```json
{
  "sub": "1234567890",     // 主题（用户 ID）
  "name": "John Doe",      // 自定义字段
  "iat": 1721100000,       // 签发时间
  "exp": 1721186400        // 过期时间
}
```

**Signature**（签名算法）：

```
HMACSHA256(
  base64UrlEncode(header) + "." + base64UrlEncode(payload),
  secret
)
```

服务和端收到 JWT 后重新计算签名，与传入的签名比对——任何 Header 或 Payload 的修改都会导致签名不匹配，从而被检测到篡改。

**重要**：JWT 是对数据做签名（防篡改），不是加密。Payload 段只是 Base64 编码，任何人都可以解码。**绝对不能将密码、身份证号等敏感信息放入 JWT**。

---

### JWT 认证流程

```
客户端                                    服务端
  |                                         |
  |--① POST /login { username, password }-->>>
  |                                         |
  |                             ② 验证用户名密码
  |                             ③ 生成 JWT + Refresh Token
  |<<--④ 返回 { accessToken, refreshToken }-|
  |                                         |
  |--⑤ GET /api/users                       |
  |     Authorization: Bearer <accessToken>-->>>
  |                                         |
  |                             ⑥ 验证 JWT 签名和过期时间
  |                             ⑦ 从 Payload 提取用户信息
  |<<--⑧ 返回用户数据-----------------------|
  |                                         |
  | (accessToken 过期后)                     |
  |--⑨ POST /refresh { refreshToken }-->>>
  |                             ⑩ 验证 refreshToken
  |                             ⑪ 生成新的 accessToken
  |<<--⑫ 返回 { accessToken }---------------|
```

---

### JWT 代码示例（Node.js）

```javascript
const jwt = require('jsonwebtoken');

// 生成 JWT
function generateToken(userId, role) {
  return jwt.sign(
    { sub: userId, role: role },       // Payload
    process.env.JWT_SECRET,            // 密钥
    { expiresIn: '15m' }              // 过期时间 15 分钟
  );
}

// 生成 Refresh Token（较长有效期）
function generateRefreshToken(userId) {
  return jwt.sign(
    { sub: userId, type: 'refresh' },
    process.env.REFRESH_SECRET,
    { expiresIn: '7d' }
  );
}

// 验证中间件
function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: '缺少 Token' });
  }

  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;  // 将用户信息注入请求对象
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token 已过期' });
    }
    return res.status(403).json({ error: 'Token 无效' });
  }
}
```

---

### JWT vs Session 对比表格

| 维度 | Session | JWT |
|------|---------|-----|
| 状态 | 有状态（服务端存储会话） | 无状态（Token 自包含信息） |
| 存储位置 | 服务端（内存/Redis/DB） | 客户端（LocalStorage/Cookie/Header） |
| 扩展性 | 需要共享 Session 存储（Redis） | 天然支持水平扩展 |
| 安全性 | 服务端控制，可即时失效 | 签发后到过期前无法主动失效 |
| 性能 | 每次请求需查询 Session 存储 | 验证签名仅 CPU 计算，无 IO |
| 跨域 | 默认不支持（Cookie 同源策略） | 天然支持（Header 传递） |
| CSRF 防护 | 需要额外处理（SameSite/CSRF Token） | 不依赖 Cookie 时天然免疫 |
| 主动登出 | 直接删除 Session | 需要 Token 黑名单或等过期 |
| 适用场景 | 传统单体应用、权限频繁变更 | 微服务、移动端、单点登录 |

---

### 双 Token 模式

**为什么**：accessToken 短时效（安全——泄露窗口小），refreshToken 长时效（体验——不用频繁登录）。

```javascript
// 刷新流程
async function refreshToken(req, res) {
  const { refreshToken } = req.body;
  try {
    const decoded = jwt.verify(refreshToken, process.env.REFRESH_SECRET);
    // 可选：检查 refreshToken 是否在黑名单（已注销）
    const newAccessToken = generateToken(decoded.sub, decoded.role);
    res.json({ accessToken: newAccessToken });
  } catch (err) {
    res.status(401).json({ error: 'Refresh Token 无效，请重新登录' });
  }
}
```

**安全增强**：refreshToken 使用独立的密钥（与 accessToken 不同）、存储在 HttpOnly Secure Cookie 中（而非 LocalStorage）、可维护白名单/黑名单以支持主动撤销。

---

### JWT 无法主动失效的应对

1. **短有效期 + 定时刷新**：accessToken 设为 5-15 分钟，refreshToken 设 7 天。accessToken 过期后用 refreshToken 换新的。需要踢人时，将用户的 refreshToken 加入黑名单。

2. **版本号/时间戳**：用户表中加 `tokenVersion` 字段，JWT 中携带该值。需要全部失效时（如修改密码），将 `tokenVersion` + 1，所有旧 Token 自动失效。

3. **Redis 黑名单**：将需要撤销的 JWT 的 jti（JWT ID）存入 Redis，TTL 覆盖 JWT 的剩余有效期。

---

### 面试官追问

**追问**：JWT 放在 Cookie 还是 LocalStorage？

**回答**：放在 HttpOnly、Secure、SameSite=Strict 的 Cookie 中是最安全的方式——JavaScript 无法读取（防御 XSS）、HTTPS 才传输、同站请求才发送。LocalStorage 的隐患是任何 JS 代码都能读取（XSS 一键盗取所有 Token），必须确保页面无 XSS 漏洞。移动端和 Native App 通常用 Keychain（iOS）/ Keystore（Android）存放，比 Web 存储更为安全。

**追问**：多个微服务如何共享 JWT 验证？

**回答**：两种方式：1) 共享密钥（对称加密 HS256）——每个微服务都持有同样的 Secret，各自验证签名，简单但 Secret 泄露影响所有服务。2) 非对称加密（RS256/ES256）——只有认证服务持有私钥（签发），其他微服务持有公钥（验证）。认证服务暴露 JWKS（JSON Web Key Set）端点，网关和各微服务定期拉取公钥。这是生产环境的标准做法。

**追问**：JWT 中的 iat、nbf、exp 分别是什么？

**回答**：iat（Issued At）——签发时间；nbf（Not Before）——此时间之前不可使用（用于未来生效的场景，如定时上线的权限）；exp（Expiration Time）——过期时间。三者都使用 UNIX 时间戳（秒），验证顺序：当前时间 > nbf 且当前时间 < exp 才算有效。
