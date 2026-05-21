import { useEffect, useRef, useCallback, useState } from 'react';
import { Link } from 'react-router';
import {
  COLS, ROWS, CELL_SIZE, SPEED,
  createGameState, tick, changeDirection, draw,
} from '../games/snake/engine';

export default function SnakeGame() {
  const canvasRef = useRef(null);
  const stateRef = useRef(createGameState());
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(() => {
    const saved = localStorage.getItem('snake-high');
    return saved ? parseInt(saved, 10) : 0;
  });
  const [gameOver, setGameOver] = useState(false);
  const [started, setStarted] = useState(false);
  const loopRef = useRef(null);
  const lastTickRef = useRef(0);

  const reset = useCallback(() => {
    stateRef.current = createGameState();
    setScore(0);
    setGameOver(false);
    setStarted(false);
    if (loopRef.current) cancelAnimationFrame(loopRef.current);
    lastTickRef.current = 0;
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      draw(ctx, stateRef.current, canvas);
    }
  }, []);

  const start = useCallback(() => {
    if (stateRef.current.started) return;
    stateRef.current = { ...stateRef.current, started: true };
    setStarted(true);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    function gameLoop(timestamp) {
      if (!lastTickRef.current) lastTickRef.current = timestamp;
      const elapsed = timestamp - lastTickRef.current;
      if (elapsed >= SPEED) {
        stateRef.current = tick(stateRef.current);
        lastTickRef.current = timestamp;
        setScore(stateRef.current.score);
        if (stateRef.current.gameOver) {
          setGameOver(true);
          setHighScore((prev) => {
            const best = Math.max(prev, stateRef.current.score);
            localStorage.setItem('snake-high', String(best));
            return best;
          });
          return;
        }
      }
      draw(ctx, stateRef.current, canvas);
      loopRef.current = requestAnimationFrame(gameLoop);
    }

    function handleKey(e) {
      const keyMap = {
        ArrowUp: { x: 0, y: -1 }, ArrowDown: { x: 0, y: 1 },
        ArrowLeft: { x: -1, y: 0 }, ArrowRight: { x: 1, y: 0 },
        w: { x: 0, y: -1 }, s: { x: 0, y: 1 },
        a: { x: -1, y: 0 }, d: { x: 1, y: 0 },
        W: { x: 0, y: -1 }, S: { x: 0, y: 1 },
        A: { x: -1, y: 0 }, D: { x: 1, y: 0 },
      };
      if (e.key === ' ' && !stateRef.current.started) {
        e.preventDefault();
        start();
        return;
      }
      if (stateRef.current.started) {
        const dir = keyMap[e.key];
        if (dir) { e.preventDefault(); stateRef.current = changeDirection(stateRef.current, dir); }
      }
    }

    window.addEventListener('keydown', handleKey);
    draw(ctx, stateRef.current, canvas);
    loopRef.current = requestAnimationFrame(gameLoop);

    return () => {
      window.removeEventListener('keydown', handleKey);
      if (loopRef.current) cancelAnimationFrame(loopRef.current);
    };
  }, [start]);

  const canvasWidth = COLS * CELL_SIZE;
  const canvasHeight = ROWS * CELL_SIZE;

  return (
    <div className="mx-auto max-w-lg">
      <Link to="/games" className="inline-flex items-center gap-1 text-sm text-text-muted hover:text-text transition-colors mb-4">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
        返回游戏列表
      </Link>

      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">贪吃蛇</h1>
        <div className="flex items-center gap-4">
          <div className="text-sm text-text-muted">分数: <span className="text-primary-light font-bold text-lg">{score}</span></div>
          <div className="text-sm text-text-muted">最高: <span className="font-bold">{highScore}</span></div>
        </div>
      </div>

      <div className="relative rounded-xl overflow-hidden border border-border shadow-lg">
        <canvas
          ref={canvasRef}
          width={canvasWidth}
          height={canvasHeight}
          className="block mx-auto"
          style={{ width: '100%', height: 'auto', aspectRatio: `${COLS}/${ROWS}` }}
        />
        {!started && !gameOver && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/60">
            <p className="text-white text-xl font-bold">🐍 贪吃蛇</p>
            <p className="text-white/70 text-sm">按 空格键 开始游戏</p>
          </div>
        )}
        {gameOver && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 gap-3">
            <p className="text-red-400 text-xl font-bold">游戏结束</p>
            <p className="text-white/80 text-sm">得分: {score}</p>
            <button onClick={reset} className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark transition-colors">
              再玩一次
            </button>
          </div>
        )}
      </div>

      <div className="mt-4 text-sm text-text-muted space-y-1">
        <p><kbd className="px-1.5 py-0.5 rounded bg-surface-alt text-xs">方向键</kbd> 或 <kbd className="px-1.5 py-0.5 rounded bg-surface-alt text-xs">WASD</kbd> 控制方向</p>
        <p><kbd className="px-1.5 py-0.5 rounded bg-surface-alt text-xs">空格键</kbd> 开始游戏</p>
      </div>
    </div>
  );
}
