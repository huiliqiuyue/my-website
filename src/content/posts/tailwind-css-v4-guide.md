---
title: "Tailwind CSS v4 迁移指南"
date: "2026-05-10"
tags: ["css", "tailwind", "前端"]
category: "前端开发"
excerpt: "Tailwind CSS v4 引入了 CSS-first 配置模式，完全抛弃了 tailwind.config.js。来看看如何迁移并利用新特性。"
---

## 最大的变化：CSS-First 配置

Tailwind CSS v4 将配置从 JavaScript 移到了 CSS 中。不再需要 `tailwind.config.js`，一切都在 CSS 文件中定义：

```css
@import "tailwindcss";

@theme {
  --font-sans: "Inter", system-ui, sans-serif;
  --color-primary: #6366f1;
}
```

## 主要改进

### 性能大幅提升

全新的 Rust 引擎速度显著提升 —— 比 v3 快 5 倍：

- 完整重建：~50ms（v3 约 250ms）
- 增量构建：~5ms（v3 约 30ms）

### 极简配置

使用 Vite 插件，只需要两步：

```bash
npm install -D @tailwindcss/vite tailwindcss
```

```javascript
// vite.config.js
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [tailwindcss()],
});
```

### 自动内容检测

不再需要 `content` 配置。Tailwind v4 自动检测你的模板文件。

## 深色模式

现在在 CSS 中配置深色模式：

```css
@custom-variant dark (&:where(.dark, .dark *));
```

## 迁移步骤

1. 将颜色、字体从 `theme.extend` 移到 `@theme` 块
2. 删除 `tailwind.config.js`
3. 用 `@import "tailwindcss"` 替换 `@tailwind base/components/utilities`
4. 测试确认所有样式正常

迁移过程整体顺畅，但如果依赖第三方 Tailwind 插件，需要仔细测试。
