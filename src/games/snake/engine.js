export const COLS = 20;
export const ROWS = 20;
export const CELL_SIZE = 20;
export const SPEED = 120;

export function createGameState() {
  const midX = Math.floor(COLS / 2);
  const midY = Math.floor(ROWS / 2);
  return {
    snake: [
      { x: midX, y: midY },
      { x: midX - 1, y: midY },
      { x: midX - 2, y: midY },
    ],
    food: randomFood([]),
    direction: { x: 1, y: 0 },
    nextDirection: { x: 1, y: 0 },
    score: 0,
    gameOver: false,
    started: false,
  };
}

function randomFood(snake) {
  const occupied = new Set(snake.map((s) => `${s.x},${s.y}`));
  const free = [];
  for (let x = 0; x < COLS; x++) {
    for (let y = 0; y < ROWS; y++) {
      if (!occupied.has(`${x},${y}`)) free.push({ x, y });
    }
  }
  return free[Math.floor(Math.random() * free.length)];
}

export function changeDirection(state, dir) {
  const { direction } = state;
  // Prevent 180-degree reversal
  if (dir.x === -direction.x && dir.y === -direction.y) return state;
  return { ...state, nextDirection: dir };
}

export function tick(state) {
  if (state.gameOver || !state.started) return state;

  const direction = state.nextDirection;
  const head = state.snake[0];
  const newHead = { x: head.x + direction.x, y: head.y + direction.y };

  // Wall collision
  if (newHead.x < 0 || newHead.x >= COLS || newHead.y < 0 || newHead.y >= ROWS) {
    return { ...state, gameOver: true, direction };
  }

  // Self collision
  if (state.snake.some((s) => s.x === newHead.x && s.y === newHead.y)) {
    return { ...state, gameOver: true, direction };
  }

  const ateFood = newHead.x === state.food.x && newHead.y === state.food.y;
  const newSnake = ateFood ? [newHead, ...state.snake] : [newHead, ...state.snake.slice(0, -1)];
  const newFood = ateFood ? randomFood(newSnake) : state.food;

  return {
    ...state,
    snake: newSnake,
    food: newFood,
    direction,
    score: ateFood ? state.score + 10 : state.score,
  };
}

export function draw(ctx, state, canvas) {
  const bg = '#111119';
  const gridLine = '#1a1a28';
  const snakeColor = '#4ade80';
  const snakeHeadColor = '#22c55e';
  const foodColor = '#ef4444';

  // Clear
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Grid lines
  ctx.strokeStyle = gridLine;
  ctx.lineWidth = 0.5;
  for (let x = 0; x <= COLS; x++) {
    ctx.beginPath();
    ctx.moveTo(x * CELL_SIZE, 0);
    ctx.lineTo(x * CELL_SIZE, ROWS * CELL_SIZE);
    ctx.stroke();
  }
  for (let y = 0; y <= ROWS; y++) {
    ctx.beginPath();
    ctx.moveTo(0, y * CELL_SIZE);
    ctx.lineTo(COLS * CELL_SIZE, y * CELL_SIZE);
    ctx.stroke();
  }

  // Snake
  state.snake.forEach(({ x, y }, i) => {
    ctx.fillStyle = i === 0 ? snakeHeadColor : snakeColor;
    const r = 3;
    const px = x * CELL_SIZE;
    const py = y * CELL_SIZE;
    ctx.beginPath();
    ctx.moveTo(px + r, py);
    ctx.lineTo(px + CELL_SIZE - r, py);
    ctx.arcTo(px + CELL_SIZE, py, px + CELL_SIZE, py + r, r);
    ctx.lineTo(px + CELL_SIZE, py + CELL_SIZE - r);
    ctx.arcTo(px + CELL_SIZE, py + CELL_SIZE, px + CELL_SIZE - r, py + CELL_SIZE, r);
    ctx.lineTo(px + r, py + CELL_SIZE);
    ctx.arcTo(px, py + CELL_SIZE, px, py + CELL_SIZE - r, r);
    ctx.lineTo(px, py + r);
    ctx.arcTo(px, py, px + r, py, r);
    ctx.closePath();
    ctx.fill();
  });

  // Food
  ctx.fillStyle = foodColor;
  ctx.beginPath();
  const fx = state.food.x * CELL_SIZE + CELL_SIZE / 2;
  const fy = state.food.y * CELL_SIZE + CELL_SIZE / 2;
  ctx.arc(fx, fy, CELL_SIZE / 2 - 2, 0, Math.PI * 2);
  ctx.fill();
}
