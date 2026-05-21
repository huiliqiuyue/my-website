---
title: "React 19 快速上手指南"
date: "2026-05-15"
tags: ["react", "javascript", "前端"]
category: "前端开发"
excerpt: "React 19 带来了 Server Components、Actions 等重磅特性，来看看有哪些新变化以及如何在项目中应用。"
---

## React 19 新特性概览

React 19 于 2024 年 12 月正式发布，带来了多项重大改进。

### Server Components（服务端组件）

React Server Components (RSC) 现已稳定。它们让你可以在服务端渲染组件，减少发送到客户端的 JavaScript 体积：

```javascript
// 此组件在服务端运行
async function BlogPosts() {
  const posts = await db.query('SELECT * FROM posts');
  return (
    <ul>
      {posts.map(post => (
        <li key={post.id}>{post.title}</li>
      ))}
    </ul>
  );
}
```

### Actions

新的 `useActionState` 和 `useFormStatus` hooks 简化了表单处理和异步操作：

```javascript
function ContactForm() {
  const [state, formAction] = useActionState(submitForm, { status: 'idle' });

  return (
    <form action={formAction}>
      <input name="email" type="email" required />
      <SubmitButton />
      {state.status === 'success' && <p>发送成功！</p>}
    </form>
  );
}
```

### 改进的 Hooks

- **`use()` hook**：在任意组件中读取 context 和 promise
- **`useOptimistic()`**：轻松实现乐观 UI 更新
- **Ref 作为 prop**：不再需要 `forwardRef` 包装器

## 迁移建议

从 React 18 升级非常顺畅。核心 API 保持不变，React 团队保持了出色的向后兼容性。

```bash
npm install react@19 react-dom@19
```

## 总结

React 19 是一个专注于开发体验和性能的版本。如果你在开始一个新项目，没有理由不使用它。
