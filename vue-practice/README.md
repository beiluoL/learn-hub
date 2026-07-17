# Vue 练手骨架 (Vue 3 + Vite + Pinia + Router + TS)

最小可运行的 Vue 3 练习项目，已内置：

- ⚡ **Vite** 构建 + 开发服务器（热更新）
- 🟦 **TypeScript**（`<script setup lang="ts">`）
- 🗃️ **Pinia** 状态管理（示例 `stores/counter.ts`）
- 🧭 **Vue Router** 路由（`/` 与 `/about`）
- 📁 路径别名 `@` → `src/`

## 快速开始

```bash
cd vue-practice
npm install        # 或 pnpm install
npm run dev        # 启动开发服务器，默认 http://localhost:5173
```

构建与预览：

```bash
npm run build      # 类型检查 + 打包到 dist/
npm run preview    # 本地预览构建产物
npm run type-check # 仅做 TS 类型检查
```

## 目录结构

```
vue-practice/
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
└── src/
    ├── main.ts            # 入口：挂载 app，注册 Pinia 与 Router
    ├── App.vue            # 根组件：导航 + <RouterView>
    ├── vite-env.d.ts      # 环境类型声明
    ├── router/
    │   └── index.ts       # 路由表
    ├── stores/
    │   └── counter.ts     # Pinia store 示例（组合式写法）
    └── views/
        ├── Home.vue       # 首页：演示 Pinia 计数器
        └── About.vue      # 关于页
```

## 下一步练手建议

1. 在 `stores/` 里加一个 `useUserStore`（登录态 / 用户信息）。
2. 加一个需要登录才能进的路由，用路由守卫 `beforeEach` 拦截。
3. 用 `axios` 封装请求，在 store 的 action 里调接口。
4. 引入一个 UI 库（如 Element Plus）美化界面。
