---
title: 前端表单最优实践：React Hook Form + Zod
category: frontend
level: intermediate
readMinutes: 16
tags: "表单, React Hook Form, Zod, 验证"
summary: 前端表单最优实践：React Hook Form + Zod。
order: 30
prereq: frontend/fe-react
---

## 受控 vs 非受控组件

理解受控与非受控是表单设计的基础。

- **受控组件**: 表单数据由 React state 管理，每个输入变化都触发状态更新
- **非受控组件**: 表单数据由 DOM 自身管理，只在需要时通过 ref 读取

```tsx
// 受控组件：每次输入都触发重渲染
import { useState } from 'react';

function ControlledForm() {
  const [email, setEmail] = useState('');

  return (
    <form>
      <input
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
    </form>
  );
}

// 非受控组件：使用 useRef 按需获取值
import { useRef } from 'react';

function UncontrolledForm() {
  const emailRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log(emailRef.current?.value);
  };

  return (
    <form onSubmit={handleSubmit}>
      <input ref={emailRef} type="email" />
      <button type="submit">Submit</button>
    </form>
  );
}
```

**注意**：复杂表单优先使用 React Hook Form，它结合了非受控的性能优势和受控的易用性。

## React Hook Form 基础

React Hook Form (RHF) 通过 `register` 将输入注册为"非受控 + API 控制"，减少不必要的渲染。

```tsx
import { useForm } from 'react-hook-form';

interface LoginInput {
  email: string;
  password: string;
  rememberMe: boolean;
}

function LoginForm() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
  } = useForm<LoginInput>({
    defaultValues: {
      rememberMe: false,
    },
  });

  const watchEmail = watch('email');

  const onSubmit = async (data: LoginInput) => {
    // 模拟 API 调用
    await new Promise((resolve) => setTimeout(resolve, 1000));
    console.log('Login with:', data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-w-sm">
      <div>
        <label htmlFor="email">Email</label>
        <input
          id="email"
          type="email"
          {...register('email', {
            required: 'Email is required',
            pattern: {
              value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
              message: 'Invalid email format',
            },
          })}
        />
        {errors.email && (
          <p className="text-red-500 text-sm">{errors.email.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="password">Password</label>
        <input
          id="password"
          type="password"
          {...register('password', {
            required: 'Password is required',
            minLength: {
              value: 6,
              message: 'Minimum 6 characters',
            },
          })}
        />
        {errors.password && (
          <p className="text-red-500 text-sm">{errors.password.message}</p>
        )}
      </div>

      <div>
        <label>
          <input type="checkbox" {...register('rememberMe')} />
          Remember me
        </label>
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full py-2 bg-blue-500 text-white rounded disabled:opacity-50"
      >
        {isSubmitting ? 'Logging in...' : 'Login'}
      </button>
    </form>
  );
}
```

## Zod Schema 验证

将验证逻辑从注册函数中抽离为独立的 Schema，使验证规则可复用和测试。

```bash
npm install react-hook-form zod @hookform/resolvers
```

```tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const signupSchema = z.object({
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(20, 'Username must be at most 20 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Only letters, numbers, and underscores'),
  email: z.string().email('Invalid email'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Must contain an uppercase letter')
    .regex(/[a-z]/, 'Must contain a lowercase letter')
    .regex(/[0-9]/, 'Must contain a number'),
  confirmPassword: z.string(),
  age: z.number().min(18, 'Must be at least 18 years old').max(120),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

type SignupInput = z.infer<typeof signupSchema>;

function SignupForm() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupInput>({
    resolver: zodResolver(signupSchema),
  });

  // ...
}
```

## 字段数组 useFieldArray

动态表单(如添加/删除列表项)使用 `useFieldArray`。

```tsx
import { useForm, useFieldArray } from 'react-hook-form';

interface FormValues {
  title: string;
  items: { name: string; quantity: number }[];
}

function ShoppingListForm() {
  const { register, control, handleSubmit } = useForm<FormValues>({
    defaultValues: {
      items: [{ name: '', quantity: 1 }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items',
  });

  return (
    <form onSubmit={handleSubmit((data) => console.log(data))}>
      <input {...register('title')} placeholder="List title" />

      {fields.map((field, index) => (
        <div key={field.id} className="flex gap-2">
          <input
            {...register(`items.${index}.name`)}
            placeholder="Item name"
          />
          <input
            type="number"
            {...register(`items.${index}.quantity`, { valueAsNumber: true })}
          />
          <button type="button" onClick={() => remove(index)}>
            Remove
          </button>
        </div>
      ))}

      <button type="button" onClick={() => append({ name: '', quantity: 1 })}>
        Add Item
      </button>
      <button type="submit">Submit</button>
    </form>
  );
}
```

## 复杂表单场景

### 条件字段

根据其他字段的值动态显示/隐藏字段。

```tsx
const planType = watch('planType');

return (
  <form>
    <select {...register('planType')}>
      <option value="free">Free</option>
      <option value="pro">Pro</option>
    </select>

    {planType === 'pro' && (
      <input {...register('company')} placeholder="Company name" />
    )}
  </form>
);
```

### 多步表单

将大型表单拆分为多步，每个步骤独立验证。

```tsx
function MultiStepForm() {
  const [step, setStep] = useState(1);
  const form = useForm<WizardInput>();

  const steps = [
    { fields: ['name', 'email'] },
    { fields: ['address', 'city', 'zipCode'] },
    { fields: ['plan', 'terms'] },
  ];

  const handleNext = async () => {
    const currentFields = steps[step - 1].fields;
    const isValid = await form.trigger(currentFields as any);
    if (isValid) setStep((s) => s + 1);
  };

  // 在最后一步提交全部数据
  const onSubmit = form.handleSubmit((data) => {
    console.log('Complete:', data);
  });

  return (
    <form onSubmit={step === steps.length ? onSubmit : undefined}>
      {/* 表单内容... */}
    </form>
  );
}
```

### 防重复提交

`isSubmitting` 自动在 `handleSubmit` 的异步函数执行期间为 `true`。配合按钮的 `disabled` 属性即可防重复提交。

```tsx
const { formState: { isSubmitting } } = useForm();

<button type="submit" disabled={isSubmitting}>
  {isSubmitting ? 'Submitting...' : 'Submit'}
</button>
```

## 实际开发中的应用 / 常见问题

### 社区常见问题

**Q: React Hook Form 和 Formik 怎么选？**

**A**: React Hook Form 基于非受控组件，性能更好(重渲染更少)，API 更轻量。Formik 基于受控组件，学习成本更低。新项目优先选择 RHF + Zod 的组合。

**Q: Zod schema 能和 TypeScript 类型保持同步吗？**

**A**: 可以。使用 `z.infer<typeof schema>` 从 schema 推导 TypeScript 类型，schema 是唯一的数据来源。任何 schema 的修改都会自动反映到类型中。

### 踩坑经验

使用 `register` 时，如果传入自定义的 `onChange`/`onBlur`，需要使用 RHF 返回的 `onChange`/`onBlur` 与自定义逻辑组合，否则验证不会触发。

```tsx
const { onChange, ...rest } = register('fieldName');

<input
  onChange={(e) => {
    onChange(e);
    customLogic(e.target.value);
  }}
  {...rest}
/>
```

服务端验证错误需要通过 `setError` 手动设置，这样 RHF 的 `formState.errors` 能统一管理客户端和服务端的验证信息。

```typescript
const onSubmit = async (data: FormInput) => {
  try {
    await api.submit(data);
  } catch (err) {
    if (err.field === 'email') {
      form.setError('email', { message: err.message });
    }
  }
};
```
