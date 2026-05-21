import { useEffect, useRef, useCallback, useState } from 'react';
import { Link } from 'react-router';
import { createState, tick, jump, draw } from '../games/runner/engine';

const CANVAS_W = 800;
const CANVAS_H = 400;

export default function RunnerGame() {
  const canvasRef = useRef(null);
  const stateRef = useRef(createState());
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(() =>
    parseInt(localStorage.getItem('runner-best') || '0')
  );
  const [gameOver, setGameOver] = useState(false);
  const [started, setStarted] = useState(false);
  const loopRef = useRef(null);

  const reset = useCallback(() => {
    stateRef.current = createState();
    setScore(0);
    setGameOver(false);
    setStarted(false);
    if (loopRef.current) cancelAnimationFrame(loopRef.current);
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      draw(ctx, stateRef.current, canvas);
    }
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    function gameLoop() {
      stateRef.current = tick(stateRef.current);
      draw(ctx, stateRef.current, canvas);

      setScore(stateRef.current.score);
      if (stateRef.current.started && !stateRef.current.started !== started) {
        setStarted(true);
      }
      if (stateRef.current.gameOver) {
        setGameOver(true);
        const best = parseInt(localStorage.getItem('runner-best') || '0');
        if (stateRef.current.score > best) {
          localStorage.setItem('runner-best', String(stateRef.current.score));
          setHighScore(stateRef.current.score);
        }
        return;
      }
      loopRef.current = requestAnimationFrame(gameLoop);
    }

    function handleInput(e) {
      if (e.type === 'keydown' && (e.key === ' ' || e.key === 'ArrowUp' || e.key === 'w')) {
        e.preventDefault();
        if (stateRef.current.gameOver) {
          reset();
          stateRef.current = { ...stateRef.current, started: true };
          setGameOver(false);
          setStarted(true);
          loopRef.current = requestAnimationFrame(gameLoop);
        } else {
          stateRef.current = jump(stateRef.current);
          if (!stateRef.current.started) {
            setStarted(true);
          }
        }
      }
    }

    function handleClick() {
      if (stateRef.current.gameOver) {
        reset();
        stateRef.current = { ...stateRef.current, started: true };
        setGameOver(false);
        setStarted(true);
        loopRef.current = requestAnimationFrame(gameLoop);
      } else {
        stateRef.current = jump(stateRef.current);
        if (!stateRef.current.started) setStarted(true);
      }
    }

    window.addEventListener('keydown', handleInput);
    canvas.addEventListener('click', handleClick);
    draw(ctx, stateRef.current, canvas);

    return () => {
      window.removeEventListener('keydown', handleInput);
      canvas.removeEventListener('click', handleClick);
      if (loopRef.current) cancelAnimationFrame(loopRef.current);
    };
  }, [reset]);

  return (
    <div className="mx-auto max-w-2xl">
      <Link to="/games" className="inline-flex items-center gap-1 text-sm text-text-muted hover:text-text transition-colors mb-4">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
        返回游戏列表
      </Link>

      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">无限跑酷</h1>
        <div className="flex items-center gap-4 text-sm">
          <span className="text-text-muted">得分 <span className="text-primary-light font-bold text-lg">{score}</span></span>
          <span className="text-text-muted">最高 <span className="font-bold">{highScore}</span></span>
        </div>
      </div>

      <div className="relative rounded-xl overflow-hidden border border-border shadow-lg cursor-pointer select-none">
        <canvas
          ref={canvasRef}
          width={CANVAS_W}
          height={CANVAS_H}
          className="block w-full"
        />

        {!started && !gameOver && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50">
            <p className="text-white text-xl font-bold mb-1">🏃 无限跑酷</p>
            <p className="text-white/60 text-sm">点击或按 空格键 开始</p>
          </div>
        )}

        {gameOver && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 gap-2">
            <p className="text-red-400 text-xl font-bold">游戏结束</p>
            <p className="text-white/80 text-sm">得分: {score} &nbsp;|&nbsp; 最高: {highScore}</p>
            <button onClick={() => {
              reset();
              stateRef.current = { ...stateRef.current, started: true };
              setGameOver(false);
              setStarted(true);
              loopRef.current = requestAnimationFrame(() => {
                const canvas = canvasRef.current;
                if (!canvas) return;
                const ctx = canvas.getContext('2d');
                function loop() {
                  stateRef.current = tick(stateRef.current);
                  draw(ctx, stateRef.current, canvas);
                  setScore(stateRef.current.score);
                  if (stateRef.current.gameOver) {
                    setGameOver(true);
                    return;
                  }
                  loopRef.current = requestAnimationFrame(loop);
                }
                loop();
              });
            }}
              className="rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-white hover:bg-primary-dark transition-colors mt-2"
            >
              再玩一次
            </button>
          </div>
        )}
      </div>

      <div className="mt-4 text-sm text-text-muted space-y-1">
        <p><kbd className="px-1.5 py-0.5 rounded bg-surface-alt text-xs">空格</kbd> <kbd className="px-1.5 py-0.5 rounded bg-surface-alt text-xs">↑</kbd> <kbd className="px-1.5 py-0.5 rounded bg-surface-alt text-xs">W</kbd> 或 <kbd className="px-1.5 py-0.5 rounded bg-surface-alt text-xs">点击</kbd> 跳跃</p>
        <p className="text-xs">躲避红色障碍，跑得越远分数越高，速度会越来越快！</p>
      </div>
    </div>
  );
}
