---
title: TypeScript 基础：类型系统入门
category: frontend
level: intermediate
readMinutes: 11
tags: TypeScript, 类型, 泛型
summary: 从 JS 到 TS，掌握基础类型、接口、联合类型、泛型与类型收窄。
order: 6
prereq: frontend/fe-js-core
---

# TypeScript 基础：类型系统入门

TypeScript 是 JavaScript 的超集，在编译期做类型检查，把大量运行时 bug 提前暴露在编辑器里。

## 一、基础类型

```typescript
let name: string = "Alice";
let age: number = 30;
let active: boolean = true;
let ids: number[] = [1, 2, 3];
let tuple: [string, number] = ["a", 1];
```

## 二、接口与类型别名

```typescript
interface User {
  id: number;
  name: string;
  email?: string;        // 可选
  readonly role: string; // 只读
}

type ID = string | number; // 联合类型
```

`interface` 可被继承/合并，`type` 更灵活（可组合联合、交叉类型）。日常对象结构优先 `interface`。

## 三、联合类型与类型收窄

```typescript
function format(value: string | number): string {
  if (typeof value === "number") {
    return value.toFixed(2); // 此处 value 被收窄为 number
  }
  return value.toUpperCase(); // 此处为 string
}
```

## 四、泛型

```typescript
function first<T>(arr: T[]): T | undefined {
  return arr[0];
}
const n = first([1, 2, 3]);   // number | undefined
const s = first(["a", "b"]);  // string | undefined
```

## 五、实用工具类型

| 工具 | 作用 |
| --- | --- |
| `Partial<T>` | 所有属性变可选 |
| `Required<T>` | 所有属性变必填 |
| `Pick<T, K>` | 挑选部分属性 |
| `Omit<T, K>` | 排除部分属性 |
| `Record<K, V>` | 构造键值映射 |

```typescript
type UserPreview = Pick<User, "id" | "name">;
```

> TS 的价值在于"编辑器即文档"：类型让重构更安全、协作更顺畅。渐进式采用即可，先给关键模块加类型。
