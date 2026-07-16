---
title: TypeScript 深入：泛型、工具类型与类型实战
category: frontend
level: advanced
readMinutes: 20
tags: "TypeScript, 泛型, 工具类型, 类型体操"
summary: TypeScript 深入：泛型、工具类型与类型实战。
order: 27
prereq: frontend/fe-typescript
---

## 泛型约束：extends 与 keyof

泛型本身是灵活的，但实际开发中需要限制泛型的范围。

### extends 约束

```typescript
// 约束 T 必须包含 length 属性
function getLength<T extends { length: number }>(value: T): number {
  return value.length;
}

getLength('hello');     // OK
getLength([1, 2, 3]);   // OK
// getLength(123);      // Error: number 没有 length 属性
```

### keyof 与泛型结合

```typescript
// 约束 K 必须是 T 的键
function getProperty<T, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key];
}

const user = { id: 1, name: 'Alice', age: 25 };
getProperty(user, 'name'); // 类型为 string
// getProperty(user, 'email'); // Error
```

### 多重泛型约束

```typescript
interface HasId {
  id: number;
}

interface HasTimestamp {
  createdAt: Date;
}

// T 必须同时满足两个约束
function processEntity<T extends HasId & HasTimestamp>(entity: T) {
  console.log(entity.id, entity.createdAt);
}
```

## 条件类型与 infer

条件类型允许根据类型关系动态选择类型。

```typescript
// 基本条件类型
type IsString<T> = T extends string ? 'yes' : 'no';
type A = IsString<string>;  // 'yes'
type B = IsString<number>;  // 'no'
```

### infer: 提取子类型

`infer` 是条件类型的强大补充，可以在匹配模式中声明一个类型变量。

```typescript
// 提取函数返回值类型
type MyReturnType<T> = T extends (...args: any[]) => infer R ? R : never;

type Fn = (x: number) => string;
type Result = MyReturnType<Fn>; // string

// 提取提取数组元素类型
type ArrayItem<T> = T extends (infer U)[] ? U : never;
type Item = ArrayItem<string[]>; // string

// 提取 Promise 内部类型
type UnwrapPromise<T> = T extends Promise<infer U> ? U : T;
type P = UnwrapPromise<Promise<number>>; // number
```

## 内置工具类型详解

TypeScript 提供了一系列实用的工具类型，理解它们有助于写出更精确的类型。

```typescript
interface User {
  id: number;
  name: string;
  email: string;
  password: string;
  createdAt: Date;
}

// Partial: 所有属性可选
type PartialUser = Partial<User>;
// { id?: number; name?: string; ... }

// Required: 所有属性必选
type RequiredUser = Required<PartialUser>;

// Pick: 选取指定属性
type UserPreview = Pick<User, 'id' | 'name'>;
// { id: number; name: string }

// Omit: 排除指定属性
type PublicUser = Omit<User, 'password'>;
// { id: number; name: string; email: string; createdAt: Date }

// Record: 构建键值对类型
type Roles = Record<'admin' | 'editor' | 'viewer', { permissions: string[] }>;

// Exclude: 从联合类型中排除
type EventTypes = 'click' | 'scroll' | 'resize' | 'keydown';
type MouseEvents = Exclude<EventTypes, 'keydown'>;
// 'click' | 'scroll' | 'resize'

// Extract: 从联合类型中提取
type ScrollEvents = Extract<EventTypes, 'scroll'>;
// 'scroll'

// ReturnType: 获取函数返回值类型
function createUser() {
  return { id: 1, name: 'Alice' };
}
type CreatedUser = ReturnType<typeof createUser>;

// Parameters: 获取函数参数类型元组
type FnParams = Parameters<(a: string, b: number) => void>;
// [a: string, b: number]
```

## 模板字面量类型

TypeScript 4.1+ 支持模板字面量类型，可以在类型层面上拼接字符串。

```typescript
type EventName<T extends string> = `on${Capitalize<T>}`;
type ClickEvent = EventName<'click'>; // 'onClick'

type CSSProperty = 'margin' | 'padding';
type CSSDirection = 'Top' | 'Right' | 'Bottom' | 'Left';
type CSSValue = `${CSSProperty}${CSSDirection}`;
// 'marginTop' | 'marginRight' | ... | 'paddingLeft'
```

## 类型守卫

类型守卫在运行时收窄类型范围，确保代码安全。

```typescript
// typeof 守卫
function process(value: string | number) {
  if (typeof value === 'string') {
    return value.toUpperCase(); // 此处 value 为 string
  }
  return value.toFixed(2); // 此处 value 为 number
}

// instanceof 守卫
function handleError(error: Error | string) {
  if (error instanceof Error) {
    console.log(error.message);
  } else {
    console.log(error);
  }
}

// 自定义类型守卫: is
interface Cat {
  type: 'cat';
  meow(): void;
}

interface Dog {
  type: 'dog';
  bark(): void;
}

function isCat(animal: Cat | Dog): animal is Cat {
  return animal.type === 'cat';
}

function interact(animal: Cat | Dog) {
  if (isCat(animal)) {
    animal.meow(); // 此处 animal 为 Cat
  } else {
    animal.bark(); // 此处 animal 为 Dog
  }
}

// in 操作符守卫
function move(pet: Cat | Dog) {
  if ('meow' in pet) {
    pet.meow();
  } else {
    pet.bark();
  }
}
```

## 型变：协变与逆变

理解型变对于高级类型设计至关重要。

- **协变(Covariance)**: `A extends B` 时，`Array<A>` 可赋值给 `Array<B>`
- **逆变(Contravariance)**: `A extends B` 时，`(param: B) => void` 可赋值给 `(param: A) => void`(参数类型反转)

```typescript
class Animal { name = ''; }
class Dog extends Animal { breed = ''; }

// 协变：Dog 数组可以赋值给 Animal 数组
let animals: Animal[] = [new Dog()];

// 逆变：函数参数是逆变的
type AnimalHandler = (a: Animal) => void;
type DogHandler = (d: Dog) => void;

// DogHandler 可以赋值给 AnimalHandler(因为 Dog 满足 Animal 的契约)
declare const handleDog: DogHandler;
const handleAnimal: AnimalHandler = handleDog;
```

## React 中的 TypeScript 类型

```typescript
import React, { FC, PropsWithChildren, ReactNode } from 'react';

// Props 类型定义
interface ButtonProps {
  variant: 'primary' | 'secondary';
  size?: 'small' | 'medium' | 'large';
  onClick?: () => void;
}

// FC 泛型(不推荐在 React 18+ 显式使用 children)
const Button: FC<ButtonProps> = ({ variant, size = 'medium', onClick }) => {
  return (
    <button onClick={onClick} className={`btn-${variant} btn-${size}`}>
      {/* children 由 FC 自动提供 */}
    </button>
  );
};

// 推荐写法：显式声明 children
function Card({
  title,
  children,
}: PropsWithChildren<{ title: string }>) {
  return (
    <div className="card">
      <h3>{title}</h3>
      <div>{children}</div>
    </div>
  );
}

// 事件处理器类型
function SearchInput() {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log(e.target.value);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      console.log('Search!');
    }
  };

  return <input onChange={handleChange} onKeyDown={handleKeyDown} />;
}
```

## 实际开发中的应用 / 常见问题

### 社区常见问题

**Q: any 和 unknown 有什么区别？**

**A**: `any` 完全跳过类型检查，赋值和访问都不会报错。`unknown` 是安全版的 `any`，你无法直接访问它的属性或调用它的方法，必须先通过类型守卫收窄。推荐优先使用 `unknown`。

**Q: as const 断言的实际用途？**

**A**: `as const` 将字面量收窄为最精确的类型(字面量类型 + readonly)。常用于创建常量集合，配合 `typeof` 推导联合类型：`const STATUSES = ['pending', 'active', 'done'] as const; type Status = typeof STATUSES[number];`

### 踩坑经验

使用 `Record` 时注意联合类型的分布律。`Record<never, T>` 是 `{}`，不是空对象类型。如果需要一个不允许任何属性的类型，使用 `Record<string, never>`。

泛型默认值可以减少调用时的类型标注：`function useState<T = undefined>(): [T | undefined, ...]`。在自定义 Hook 中经常使用默认泛型来简化调用方代码。

当使用条件类型处理联合类型时，TypeScript 会自动进行分布式条件判断：`ToArray<string | number>` 会展开为 `ToArray<string> | ToArray<number>`。如果不希望这种分布行为，将泛型包裹在元组中：`[T] extends [SomeType]`。
