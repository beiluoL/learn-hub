---
title: 前端测试：Vitest + React Testing Library 实战
category: frontend
level: intermediate
readMinutes: 18
tags: "测试, Vitest, RTL, 前端测试"
summary: 前端测试：Vitest + React Testing Library 实战。
order: 23
prereq: frontend/fe-react
---

## 测试金字塔

前端测试体系通常按照测试金字塔模型构建：

- **单元测试**: 测试单个函数/组件的最小行为，执行快，占比最大
- **集成测试**: 测试多个模块协作是否正常，是最有价值的测试层
- **E2E (端到端)测试**: 模拟真实用户操作流程，执行慢但覆盖关键路径

推荐的比例大约是 60% 单元测试 + 30% 集成测试 + 10% E2E。前端测试的重点应该放在集成测试——模拟用户操作，验证组件的行为。

## Vitest 配置与断言

Vitest 是专为 Vite 设计的测试框架，与 Jest API 高度兼容，启动速度远超 Jest。

```js
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',       // 模拟 DOM 环境
    setupFiles: ['./src/test/setup.ts'], // 全局初始化
    globals: true,              // 无需导入 describe/it/expect
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
    },
  },
});
```

基础断言示例：

```ts
import { describe, it, expect } from 'vitest';

function sum(a: number, b: number) {
  return a + b;
}

describe('sum', () => {
  it('should add two numbers correctly', () => {
    expect(sum(1, 2)).toBe(3);
  });

  it('should handle negative numbers', () => {
    expect(sum(-1, 1)).toBe(0);
  });
});
```

## React Testing Library 哲学

React Testing Library (RTL) 的核心哲学是：**按用户使用方式测试**。用户不会关心组件内部 state 或 props，他们看到的是渲染的文本、操作的按钮、填写的表单。

因此 RTL 鼓励使用语义化查询方法(`getByRole`、`getByLabelText`)而不是直接的 DOM 选择器。

### 常用查询方法

| 方法 | 用途 | 示例 |
|------|------|------|
| `getByRole` | 按 ARIA role 查找 | `getByRole('button', { name: 'Submit' })` |
| `getByText` | 按文本内容查找 | `getByText('Welcome')` |
| `getByLabelText` | 按表单 label 查找 | `getByLabelText('Email')` |
| `getByTestId` | 按 data-testid 查找 | `getByTestId('submit-btn')` |

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect } from 'vitest';
import { LoginForm } from './LoginForm';

describe('LoginForm', () => {
  it('should render email and password fields', () => {
    render(<LoginForm />);

    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
  });

  it('should show validation error for empty email', async () => {
    const user = userEvent.setup();
    render(<LoginForm />);

    // 不填写邮箱，直接点击登录
    await user.click(screen.getByRole('button', { name: /login/i }));

    expect(await screen.findByText('Email is required')).toBeInTheDocument();
  });

  it('should call onSubmit with form data', async () => {
    const user = userEvent.setup();
    const handleSubmit = vi.fn();
    render(<LoginForm onSubmit={handleSubmit} />);

    await user.type(screen.getByLabelText('Email'), 'test@example.com');
    await user.type(screen.getByLabelText('Password'), 'password123');
    await user.click(screen.getByRole('button', { name: /login/i }));

    expect(handleSubmit).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password123',
    });
  });
});
```

**注意**：优先使用 `getByRole`，它最接近用户体验；仅当无法用语义方法时才使用 `getByTestId`。

## fireEvent vs userEvent

`fireEvent` 是同步触发单个 DOM 事件，而 `userEvent` 模拟完整的用户交互(包括 click 前的 hover、focus，input 时的 keydown/keyup/change 等)。

```tsx
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// fireEvent: 直接调度事件
fireEvent.change(input, { target: { value: 'hello' } });

// userEvent: 模拟真实用户输入行为
const user = userEvent.setup();
await user.type(input, 'hello');
```

**推荐始终使用 `userEvent`**，它更真实地模拟浏览器行为。

## 异步测试与 Mock API

React 组件常涉及异步数据获取，RTL 提供了 `waitFor` 和 `findBy` 查询来处理异步状态。

```tsx
import { render, screen, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';

// 使用 MSW (Mock Service Worker) 拦截网络请求
const server = setupServer(
  http.get('/api/user', () => {
    return HttpResponse.json({ name: 'John', age: 30 });
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

function UserProfile() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    fetch('/api/user')
      .then((res) => res.json())
      .then(setUser);
  }, []);

  if (!user) return <div>Loading...</div>;
  return <div>Welcome, {user.name}</div>;
}

describe('UserProfile', () => {
  it('should load and display user name', async () => {
    render(<UserProfile />);
    expect(screen.getByText('Loading...')).toBeInTheDocument();

    // findBy 内置了 waitFor，会等待元素出现
    expect(await screen.findByText('Welcome, John')).toBeInTheDocument();
  });

  it('should handle API error', async () => {
    server.use(
      http.get('/api/user', () => {
        return new HttpResponse(null, { status: 500 });
      })
    );

    render(<UserProfile />);
    expect(await screen.findByText(/error/i)).toBeInTheDocument();
  });
});
```

## 测试覆盖率

Vitest 的覆盖率报告可以帮助识别未测试的代码路径。但覆盖率是一个参考指标而非目标：100% 覆盖率不一定意味着测试充分，关键是保证核心业务逻辑的覆盖。

```bash
npx vitest --coverage
```

## 实际开发中的应用 / 常见问题

### 社区常见问题

**Q: 应该测试什么，不应该测试什么？**

**A**: 应该测试：用户关键交互流程(表单提交/登录)、数据转换逻辑、边界条件(空状态/错误状态)、API 交互。不应该测试：框架内部实现、第三方库的行为、纯样式变化、简单的 getter/setter。

**Q: Snapshot 测试值得写吗？**

**A**: Snapshot 适用于输出稳定的纯展示组件。但对于频繁变化的 UI，Snapshot 会产生大量噪音。如果使用 Snapshot，确保使用小粒度的快照(单组件)而非大块快照。

### 踩坑经验

使用 `@testing-library/react` 时，`screen.debug()` 可以在测试失败时打印当前 DOM 结构，帮助定位问题。测试中如果遇到 "not wrapped in act(...)" 警告，通常是因为异步状态更新在测试结束后才发生，使用 `waitFor` 或 `act` 包裹即可解决。

测试文件命名约定：`Component.test.tsx` 或 `Component.spec.tsx`，放在与组件同目录下 `__tests__/` 文件夹中，或者与组件同层。两种方案各有利弊，团队协商一致即可。
