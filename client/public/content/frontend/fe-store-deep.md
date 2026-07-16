---
title: 前端状态管理方案对比与选型
category: frontend
level: advanced
readMinutes: 20
tags: "状态管理, Redux, Zustand, Context"
summary: 前端状态管理方案对比与选型。
order: 31
prereq: frontend/fe-state
---

## 状态分类

在讨论状态管理方案之前，先理解前端应用中的状态分为哪些类型。

| 类型 | 示例 | 管理方式 |
|------|------|---------|
| Server State | 用户列表、文章数据 | React Query / SWR |
| URL State | 搜索参数、分页 | useSearchParams |
| Local State | 表单输入、开关状态 | useState / useReducer |
| Global State | 用户信息、主题 | Zustand / Redux / Context |
| Client State | 乐观更新、草稿 | 状态管理库 |

**注意**：不是所有数据都需要全局状态。区分状态类型后，很多"全局状态"其实更适合用 React Query(Server State)或 URL 参数(URL State)管理。

## Context + useReducer: 简单场景

当全局状态量不大，且不需要性能优化(如选择器订阅)时，Context + useReducer 是最轻量的方案。

```tsx
import { createContext, useContext, useReducer, ReactNode } from 'react';

// State + Action 定义
interface AppState {
  user: { name: string } | null;
  theme: 'light' | 'dark';
}

type Action =
  | { type: 'SET_USER'; payload: AppState['user'] }
  | { type: 'TOGGLE_THEME' };

const initialState: AppState = {
  user: null,
  theme: 'light',
};

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SET_USER':
      return { ...state, user: action.payload };
    case 'TOGGLE_THEME':
      return { ...state, theme: state.theme === 'light' ? 'dark' : 'light' };
    default:
      return state;
  }
}

// Context 分层(避免不必要渲染)
const StateContext = createContext<AppState>(initialState);
const DispatchContext = createContext<React.Dispatch<Action>>(() => {});

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  return (
    <StateContext.Provider value={state}>
      <DispatchContext.Provider value={dispatch}>
        {children}
      </DispatchContext.Provider>
    </StateContext.Provider>
  );
}

export function useAppState() {
  return useContext(StateContext);
}

export function useAppDispatch() {
  return useContext(DispatchContext);
}
```

**性能陷阱**：Context 任何值的变化都会导致整个消费者树重渲染。这就是为什么在中等规模以上应用中需要专门的状态管理库。

## Zustand: 轻量状态管理

Zustand 是目前 React 生态最受欢迎的轻量状态管理方案之一，API 极简且内置性能优化。

```tsx
import { create } from 'zustand';

interface BearStore {
  bears: number;
  increase: (by: number) => void;
  reset: () => void;
}

const useBearStore = create<BearStore>((set) => ({
  bears: 0,
  increase: (by) => set((state) => ({ bears: state.bears + by })),
  reset: () => set({ bears: 0 }),
}));

// 使用选择器避免不必要的渲染
function BearCounter() {
  const bears = useBearStore((state) => state.bears);
  return <h2>{bears} bears</h2>;
}

function Controls() {
  const increase = useBearStore((state) => state.increase);
  return <button onClick={() => increase(1)}>Add Bear</button>;
}
```

### 中间件

```tsx
import { create } from 'zustand';
import { persist, devtools } from 'zustand/middleware';

interface SettingsStore {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

const useSettingsStore = create<SettingsStore>()(
  devtools(
    persist(
      (set) => ({
        theme: 'light',
        toggleTheme: () =>
          set((s) => ({ theme: s.theme === 'light' ? 'dark' : 'light' })),
      }),
      { name: 'settings-storage' } // 自动同步到 localStorage
    ),
    { name: 'SettingsStore' } // DevTools 中显示的名称
  )
);
```

## Redux Toolkit: 企业级方案

Redux Toolkit (RTK) 大大简化了 Redux 的使用，减少了样板代码。适合大型团队和复杂状态逻辑。

```tsx
import { configureStore, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Provider, useSelector, useDispatch } from 'react-redux';

// Slice: 包含 reducer + actions 的一体化定义
const todoSlice = createSlice({
  name: 'todos',
  initialState: {
    items: [] as { id: number; text: string; done: boolean }[],
    filter: 'all' as 'all' | 'done' | 'undone',
  },
  reducers: {
    addTodo: (state, action: PayloadAction<string>) => {
      state.items.push({
        id: Date.now(),
        text: action.payload,
        done: false,
      });
    },
    toggleTodo: (state, action: PayloadAction<number>) => {
      const todo = state.items.find((t) => t.id === action.payload);
      if (todo) todo.done = !todo.done;
    },
    setFilter: (state, action: PayloadAction<'all' | 'done' | 'undone'>) => {
      state.filter = action.payload;
    },
  },
});

export const { addTodo, toggleTodo, setFilter } = todoSlice.actions;

const store = configureStore({
  reducer: {
    todos: todoSlice.reducer,
  },
});

// RTK Query: 服务端状态管理
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const api = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({ baseUrl: '/api' }),
  endpoints: (builder) => ({
    getUsers: builder.query<{ id: number; name: string }[], void>({
      query: () => '/users',
    }),
    updateUser: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/users/${id}`,
        method: 'PUT',
        body,
      }),
    }),
  }),
});
```

**注意**：Redux Toolkit 使用 Immer 在底层允许"直接修改"state，实际上创建的是不可变副本。

## Jotai: 原子化状态

Jotai 提供原子化的状态管理思路，状态由独立的 atom 组成，组件只订阅自己需要的 atom。

```tsx
import { atom, useAtom } from 'jotai';

// 独立原子
const countAtom = atom(0);
const textAtom = atom('hello');

// 派生原子(依赖其他原子)
const doubleCountAtom = atom((get) => get(countAtom) * 2);

function Counter() {
  const [count, setCount] = useAtom(countAtom);
  const [double] = useAtom(doubleCountAtom);

  return (
    <div>
      <p>Count: {count}, Double: {double}</p>
      <button onClick={() => setCount((c) => c + 1)}>+1</button>
    </div>
  );
}
```

## 选型决策表

| 场景 | 推荐方案 | 理由 |
|------|---------|------|
| 简单项目、少量全局状态 | Context + useReducer | 零依赖，足够简单 |
| 中小项目、需要选择器 | Zustand | 极简 API，内置性能 |
| 大型团队、严格规范 | Redux Toolkit | 强约束、中间件生态 |
| 细粒度订阅 | Jotai | 原子化，按需渲染 |
| 服务端数据为主 | React Query / RTK Query | 专注 Server State |
| 需要持久化 | Zustand + persist | 一行配置 |

## 实际开发中的应用 / 常见问题

### 社区常见问题

**Q: 项目中同时使用 Redux Toolkit 和 Zustand 合理吗？**

**A**: 不推荐混用两个全局状态库。如果已有 Redux Toolkit，用 RTK Query 管理服务端状态即可。如果新项目从 Zustand 开始，搭配 React Query 管理服务端状态。避免同类型状态分散在多个库中。

**Q: 如何避免 Context 的性能问题？**

**A**: 将 State Context 和 Dispatch Context 分离，dispatch 的引用是稳定的，不会导致消费者重渲染。或者将一个大 Context 拆分成多个小 Context，每个只负责一部分数据。最终如果复杂度上升，切换到 Zustand 或 Jotai。

### 踩坑经验

使用 Zustand 时，选择器返回新对象会导致频繁渲染。因为 Zustand 默认使用 `Object.is` 浅比较，新对象每次都是不同引用。解决方法：在 `create` 中使用第二个参数 `(state) => state.items`，或使用 `useShallow`。

```tsx
import { useShallow } from 'zustand/shallow';

// 避免返回新对象
const { name, age } = useUserStore(
  useShallow((s) => ({ name: s.name, age: s.age }))
);
```

Redux Toolkit 的 `createAsyncThunk` 与 React Query 有功能重叠。建议当数据主要是服务端状态时，直接使用 React Query 而非 thunk。当有复杂的本地状态逻辑需要与异步结合时，再使用 thunk。
