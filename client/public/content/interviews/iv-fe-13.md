---
question: 什么是跨域？有哪些解决方案？CORS 的预检请求什么时候触发？
category: frontend
difficulty: middle
tags: "跨域, CORS, JSONP, 代理, 同源策略"
order: 65
---

**核心结论**：跨域是由浏览器的**同源策略**（Same-Origin Policy）引起的安全限制。同源策略要求页面的协议、域名和端口三者必须完全一致，否则就构成跨域。跨域有 9 种解决方案，其中最常用的是 **CORS（跨域资源共享）**。CORS 将请求分为简单请求和非简单请求两类，**非简单请求在发送实际请求前会先发一个 OPTIONS 预检请求**，询问服务器是否允许该跨域操作。

## 同源策略详解

**同源的定义**：两个 URL 的**协议**、**域名**、**端口**三者完全相同才算同源。

| URL 1（当前页面）              | URL 2（请求目标）               | 是否跨域 | 原因           |
|------------------------------|-------------------------------|---------|----------------|
| `http://www.a.com/page`      | `http://www.a.com/api`        | 否      | 同源           |
| `http://www.a.com`           | `https://www.a.com`           | 是      | 协议不同       |
| `http://www.a.com`           | `http://api.a.com`            | 是      | 子域名不同     |
| `http://www.a.com:80`        | `http://www.a.com:8080`       | 是      | 端口不同       |
| `http://www.a.com`           | `http://www.b.com`            | 是      | 主域名不同     |

**同源策略限制的内容**：
- Cookie、LocalStorage、IndexedDB 等存储性内容
- DOM 节点（通过 iframe 的 contentWindow）
- AJAX 请求（XMLHttpRequest、Fetch API）

**不受同源策略限制的内容**：
- `<script>` 标签加载的 JS（所以能实现 JSONP）
- `<img>` 标签加载的图片
- `<link>` 标签加载的 CSS
- `<video>` / `<audio>` 标签加载的多媒体

## 跨域解决方案

### 1. CORS（Cross-Origin Resource Sharing）— 最主流

CORS 是 W3C 标准，通过服务器设置响应头来允许跨域请求。这是目前最标准、最安全的方案。

**简单请求**（同时满足以下条件）：

1. 请求方法为 `GET`、`HEAD`、`POST` 之一
2. Content-Type 仅限于 `text/plain`、`multipart/form-data`、`application/x-www-form-urlencoded`
3. 无自定义请求头

简单请求直接发送，浏览器自动添加 `Origin` 头部，服务器返回 `Access-Control-Allow-Origin` 检查。

**非简单请求**（任一条件不满足即视为非简单）：

非简单请求（如 PUT、DELETE 方法，或 Content-Type 为 `application/json`、携带自定义请求头 `Authorization`）在发送实际请求前，浏览器会**自动发送一个 OPTIONS 预检请求**：

```http
OPTIONS /api/users HTTP/1.1
Host: api.example.com
Origin: http://localhost:3000
Access-Control-Request-Method: DELETE
Access-Control-Request-Headers: Authorization
```

服务器需要响应：

```http
HTTP/1.1 204 No Content
Access-Control-Allow-Origin: http://localhost:3000
Access-Control-Allow-Methods: GET, POST, PUT, DELETE
Access-Control-Allow-Headers: Authorization, Content-Type
Access-Control-Max-Age: 86400   ← 预检结果缓存 24 小时
```

预检通过后，浏览器才会发送真正的 DELETE 请求。

**服务端 CORS 配置（Java Spring 示例）**：

```java
@Configuration
public class CorsConfig implements WebMvcConfigurer {
    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")
                .allowedOrigins("http://localhost:3000", "https://example.com")
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                .allowedHeaders("*")
                .allowCredentials(true)  // 允许携带 Cookie
                .maxAge(3600);           // 预检缓存时间
    }
}
```

**CORS 关键响应头**：

| 响应头                               | 含义                           |
|-------------------------------------|-------------------------------|
| `Access-Control-Allow-Origin`        | 允许的来源域名（不能为 `*` + `credentials: true`） |
| `Access-Control-Allow-Methods`       | 允许的 HTTP 方法               |
| `Access-Control-Allow-Headers`       | 允许的请求头                   |
| `Access-Control-Allow-Credentials`   | 是否允许携带 Cookie           |
| `Access-Control-Max-Age`             | 预检缓存时间（秒）             |
| `Access-Control-Expose-Headers`      | 允许前端 JS 读取的响应头       |

```javascript
// 前端携带 Cookie
fetch('http://api.example.com/user', {
    method: 'GET',
    credentials: 'include',  // 携带 Cookie
})
.then(res => res.json())
.then(data => console.log(data));
```

### 2. JSONP（JSON with Padding）— 仅 GET

利用 `<script>` 标签不受同源策略限制的原理，通过动态创建 script 标签来加载跨域数据：

```javascript
// 前端
function jsonp(url, callbackName) {
    return new Promise((resolve, reject) => {
        // 1. 创建全局回调函数
        window[callbackName] = (data) => {
            resolve(data);
            document.body.removeChild(script);
            delete window[callbackName];
        };

        // 2. 动态创建 script 标签
        const script = document.createElement('script');
        script.src = `${url}?callback=${callbackName}`;
        document.body.appendChild(script);
    });
}

// 使用
jsonp('http://api.example.com/data', 'myCallback')
    .then(data => console.log(data));
```

**局限性**：仅支持 GET 请求，不安全（XSS 风险），无法设置自定义请求头，无法携带 Cookie。

### 3. 开发代理（Proxy）— 开发环境首选

#### Vite 配置：

```javascript
// vite.config.js
export default {
    server: {
        proxy: {
            '/api': {
                target: 'http://localhost:8080',
                changeOrigin: true,
                rewrite: (path) => path.replace(/^\/api/, '')
            }
        }
    }
};
```

#### Webpack 配置：

```javascript
// webpack.config.js
module.exports = {
    devServer: {
        proxy: {
            '/api': {
                target: 'http://localhost:8080',
                changeOrigin: true
            }
        }
    }
};
```

### 4. Nginx 反向代理 — 生产环境首选

```nginx
server {
    listen 80;
    server_name www.example.com;

    # 前端静态资源
    location / {
        root /usr/share/nginx/html;
        index index.html;
    }

    # API 反向代理
    location /api/ {
        proxy_pass http://backend-server:8080/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

前后端同域同端口访问，从根本上规避跨域。

### 5-9. 其他方案

**postMessage**：用于页面与嵌入的 iframe 之间的跨窗口通信。

```javascript
// 发消息
iframe.contentWindow.postMessage({ type: 'login' }, 'http://other.com');

// 接收消息
window.addEventListener('message', (event) => {
    if (event.origin === 'http://other.com') {
        console.log(event.data);
    }
});
```

**WebSocket**：WebSocket 不受同源策略限制，天然支持跨域通信。

**document.domain**：仅适用于主域名相同、子域名不同的场景（如 `a.example.com` 和 `b.example.com`），将两个页面的 `document.domain` 都设为 `"example.com"`。

**nginx 反向代理**：生产环境最推荐的方案，完全从协议层面解决，浏览器无感知。

**window.name** + iframe：利用 `window.name` 在不同页面跳转后仍然存在的特性实现跨域传值（历史方案，已不推荐）。

## 面试官追问

**1. CORS 和 JSONP 的本质区别是什么？**

CORS 是 W3C 标准，本质是**服务器授权**，支持所有 HTTP 方法，安全可控。JSONP 是**客户端规避策略**，利用了 `<script>` 标签的漏洞，仅支持 GET，有 XSS 安全风险。CORS 通过 HTTP 头部协商来进行跨域控制，JSONP 则完全依赖客户端构造。推荐在服务器支持的情况下优先使用 CORS。

**2. 为什么 OPTIONS 预检请求由浏览器自动发起而非在前端代码中手动发送？**

这是浏览器安全机制的一部分。如果依赖前端手动判断是否需要预检，恶意脚本可以故意跳过这个步骤。由浏览器在底层自动发起 OPTIONS 请求，确保**所有非简单请求都经过服务器授权**，前端无法绕过。`Access-Control-Max-Age` 缓存预检结果也是浏览器层面实现的，避免每次请求都要重发 OPTIONS。
