---
title: 前端 Web 安全攻防实战
category: frontend
level: advanced
readMinutes: 18
tags: "安全, XSS, CSRF, CSP"
summary: 前端 Web 安全攻防实战。
order: 24
prereq: frontend/fe-js-core
---

## XSS (跨站脚本攻击)

XSS 是最常见的前端安全漏洞之一。攻击者将恶意脚本注入页面，在受害者浏览器中执行。根据注入方式，XSS 分为三种类型。

### 反射型 XSS

恶意脚本通过 URL 参数等方式注入，服务端直接反射回页面。

```
https://example.com/search?q=<script>alert(document.cookie)</script>
```

**防范**：永远不要将用户输入直接插入 HTML，对输出进行转义。

### 存储型 XSS

恶意代码被存储到数据库中(如评论、用户昵称)，每次加载页面时执行。

```javascript
// 危险的代码
const comment = '<img src=x onerror="alert(\'XSS\')">';
document.getElementById('comments').innerHTML = comment; // 危险！

// 安全的做法：使用 textContent 或 DOMPurify
import DOMPurify from 'dompurify';

const clean = DOMPurify.sanitize(comment);
document.getElementById('comments').innerHTML = clean;
```

### DOM 型 XSS

攻击发生在客户端，通过修改 DOM 执行恶意代码，不经过服务端。

```tsx
// 危险：直接使用 location.hash
function DangerousComponent() {
  const hash = window.location.hash.slice(1);
  return <div dangerouslySetInnerHTML={{ __html: hash }} />;
}

// 安全：避免使用 dangerouslySetInnerHTML 或使用 DOMPurify
import DOMPurify from 'dompurify';

function SafeComponent() {
  const hash = window.location.hash.slice(1);
  const sanitized = DOMPurify.sanitize(hash);
  return <div dangerouslySetInnerHTML={{ __html: sanitized }} />;
}
```

### CSP (Content Security Policy)

CSP 通过 HTTP Header 或 meta 标签限制页面可以加载的资源来源，从根本上防御 XSS。

```
Content-Security-Policy: default-src 'self'; script-src 'self' 'nonce-{random}'; style-src 'self' 'unsafe-inline'
```

关键指令说明：
- `default-src 'self'`: 默认只加载同源资源
- `script-src 'nonce-xxx'`: 只有带正确 nonce 的内联脚本可以执行，阻止注入的脚本
- `style-src 'self'`: 限制样式来源

## CSRF (跨站请求伪造)

CSRF 利用用户已登录的身份，诱导用户点击恶意链接执行非预期操作。

### 攻击原理

用户登录了 `bank.com` 后，访问了恶意网站 `evil.com`。`evil.com` 中有一个隐藏表单向 `bank.com/transfer` 发起 POST 请求，由于浏览器自动携带 cookie，请求通过了身份验证。

### 防护方案

**SameSite Cookie**：设置 Cookie 的 SameSite 属性，限制跨站请求携带 cookie。

```
Set-Cookie: sessionId=abc123; SameSite=Strict; Secure; HttpOnly
```

- **Strict**: 完全禁止第三方携带 cookie
- **Lax**: 允许顶部导航 GET 请求携带，表单 POST 不允许(默认值)
- **None**: 允许跨站携带(必须配合 Secure)

**CSRF Token**：在表单中嵌入一个随机生成的 Token，服务端验证。

```tsx
function TransferForm() {
  const [csrfToken] = useState(() => crypto.randomUUID());

  return (
    <form method="POST" action="/api/transfer">
      <input type="hidden" name="csrf_token" value={csrfToken} />
      <input name="amount" type="number" />
      <button type="submit">Transfer</button>
    </form>
  );
}
```

## 点击劫持 (Clickjacking)

攻击者通过透明 iframe 覆盖在网页上，诱导用户点击攻击者想要的目标。

**防护**：设置 `X-Frame-Options` HTTP Header 或在 CSP 中使用 `frame-ancestors`。

```
X-Frame-Options: DENY
Content-Security-Policy: frame-ancestors 'none'
```

## CORS 跨域与安全

CORS (跨域资源共享) 允许服务端控制哪些源可以访问资源。配置不当可能导致敏感数据泄露。

```javascript
// 危险的配置
Access-Control-Allow-Origin: *
Access-Control-Allow-Credentials: true
// 两者同时存在属于无效配置，浏览器会拒绝

// 安全的配置
Access-Control-Allow-Origin: https://trusted.example.com
Access-Control-Allow-Credentials: true
```

## 敏感信息保护

### 硬编码密钥

绝对不要在客户端代码中硬编码 API Key、Token 等敏感信息。

```javascript
// 危险
const API_KEY = 'sk-abc123xyz456';

// 安全：通过环境变量或后端代理
const response = await fetch('/api/proxy', {
  headers: { 'Content-Type': 'application/json' },
});
```

### 源码泄露

检查 `.gitignore` 确保 `.env` 等敏感文件不被提交。使用 `.env.example` 提供模板。

前端代码中的所有内容都暴露在浏览器中。敏感逻辑应该放在服务端，前端只传递和展示处理后的结果。

## npm 供应链安全

- 锁定依赖版本(使用 `package-lock.json` 或 `yarn.lock`)
- 定期运行 `npm audit` 检查已知漏洞
- 使用 `npm ci` 替代 `npm install` 进行 CI 构建
- 审核引入的第三方包的维护状态和代码量

## HTTPS / HSTS

HTTPS 加密传输数据，防止中间人攻击和内容篡改。HSTS (HTTP Strict Transport Security) 强制浏览器只能通过 HTTPS 访问你的站点。

```
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
```

## 实际开发中的应用 / 常见问题

### 社区常见问题

**Q: React 默认会转义 JSX 中的内容，那还需要担心 XSS 吗？**

**A**: React 确实会自动转义 JSX 中的表达式内容(如 `{userInput}`)，但 `dangerouslySetInnerHTML`、`<a href={userInput}>`、表单的 `action` 属性等不会自动转义。另外服务端渲染(Next.js)也需要额外注意。

**Q: 上线前如何做安全自查？**

**A**: 检查所有使用 `dangerouslySetInnerHTML`/`innerHTML` 的地方；确保 CSP Header 正确配置；检查是否暴露了 API Key；运行 `npm audit`；检查第三方依赖是否有已知漏洞。

### 踩坑经验

在设置 CSP 时，`'unsafe-inline'` 会显著削弱 CSP 的防护能力。如果必须使用内联样式或脚本，优先使用 nonce 或 hash 机制。Sentry 等监控 SDK 可能需要调整 CSP 配置允许其上报端点。

Cookie 的 `HttpOnly` 属性可以防止 JavaScript 通过 `document.cookie` 读取，结合 `Secure` 和 `SameSite` 构成三重防护。但 `HttpOnly` Cookie 不能完全防御 CSRF，因为 HTTP 请求仍然会自动携带。
