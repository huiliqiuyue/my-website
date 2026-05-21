---
title: "用 JavaScript 写小游戏"
date: "2026-05-01"
tags: ["javascript", "游戏", "canvas"]
category: "教程"
excerpt: "贪吃蛇、2048、扫雷——用纯 JavaScript 实现经典小游戏，理解游戏开发的核心思想。"
---

## 为什么要写游戏？

写游戏是提升编程能力的最佳方式之一。游戏开发会锻炼你的：

- 状态管理能力
- 用户输入处理
- 渲染与动画
- 游戏逻辑设计

## 贪吃蛇架构设计

一个清晰的贪吃蛇实现会关注点分离为三个层次：

### 1. 游戏状态

```javascript
function createGameState(cols, rows) {
  return {
    snake: [{ x: Math.floor(cols / 2), y: Math.floor(rows / 2) }],
    food: { x: 5, y: 5 },
    direction: { x: 1, y: 0 },
    score: 0,
    gameOver: false,
  };
}
```

### 2. 游戏逻辑（纯函数）

```javascript
function tick(state) {
  const head = state.snake[0];
  const newHead = {
    x: head.x + state.direction.x,
    y: head.y + state.direction.y,
  };

  if (newHead.x < 0 || newHead.x >= COLS || newHead.y < 0 || newHead.y >= ROWS) {
    return { ...state, gameOver: true };
  }

  const ateFood = newHead.x === state.food.x && newHead.y === state.food.y;
  const newSnake = ateFood
    ? [newHead, ...state.snake]
    : [newHead, ...state.snake.slice(0, -1)];

  return { ...state, snake: newSnake, food: ateFood ? randomFood() : state.food, score: ateFood ? state.score + 1 : state.score };
}
```

### 3. 渲染（Canvas）

```javascript
function draw(ctx, state) {
  // 清屏
  ctx.fillStyle = '#111119';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // 画蛇
  ctx.fillStyle = '#4ade80';
  state.snake.forEach(({ x, y }) => {
    ctx.fillRect(x * CELL, y * CELL, CELL - 1, CELL - 1);
  });

  // 画食物
  ctx.fillStyle = '#ef4444';
  ctx.beginPath();
  ctx.arc(
    state.food.x * CELL + CELL / 2,
    state.food.y * CELL + CELL / 2,
    CELL / 2 - 1, 0, Math.PI * 2
  );
  ctx.fill();
}
```

## 2048 游戏设计

2048 非常适合用 React 状态管理实现。棋盘是 4×4 的网格，每次移动会变换棋盘：

- 向选择方向**滑动**方块
- 相邻相同方块**合并**
- 在随机空格**生成**新的 2 或 4

核心思想是整个游戏就是单一的状态转换：`棋盘 + 方向 → 新棋盘 + 分数`。

## 总结

游戏开发教会你**状态机思维**。每个游戏本质上都是：

```
状态 → 用户输入 → 新状态 → 渲染 → 循环
```

这个模式适用于所有交互式应用，不只是游戏。
