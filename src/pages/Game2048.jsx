import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router';
import { createBoard, move, isGameOver, hasWon } from '../games/2048/engine';

const tileStyle = (value) => {
  const base = {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontWeight: 700, borderRadius: 8, aspectRatio: '1',
    transition: 'all 0.1s ease',
    fontSize: value >= 1024 ? '1.2rem' : value >= 100 ? '1.5rem' : '1.8rem',
  };

  const colors = {
    0:    { bg: '#2a2a3e', color: 'transparent' },
    2:    { bg: '#3a3a55', color: '#e2e8f0' },
    4:    { bg: '#4a4060', color: '#e2e8f0' },
    8:    { bg: '#e07b39', color: '#fff' },
    16:   { bg: '#e05a2d', color: '#fff' },
    32:   { bg: '#e0483b', color: '#fff' },
    64:   { bg: '#d63230', color: '#fff' },
    128:  { bg: '#e0b044', color: '#fff' },
    256:  { bg: '#e0c344', color: '#fff' },
    512:  { bg: '#e0a830', color: '#fff' },
    1024: { bg: '#e0981c', color: '#fff' },
    2048: { bg: '#eab308', color: '#fff', boxShadow: '0 0 20px rgba(234,179,8,0.4)' },
    4096: { bg: '#ef4444', color: '#fff' },
    8192: { bg: '#22d3ee', color: '#111' },
  };

  const c = colors[value] || { bg: '#111', color: '#fff' };
  return { ...base, backgroundColor: c.bg, color: c.color, boxShadow: c.boxShadow || 'none' };
};

export default function Game2048() {
  const [board, setBoard] = useState(createBoard);
  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = useState(() => {
    const saved = localStorage.getItem('2048-best');
    return saved ? parseInt(saved, 10) : 0;
  });
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);

  const handleMove = useCallback((dir) => {
    setBoard((prev) => {
      if (gameOver || won) return prev;
      const result = move(prev, dir);
      if (result.moved) {
        setScore((s) => {
          const newScore = s + result.score;
          setBestScore((b) => {
            const best = Math.max(b, newScore);
            localStorage.setItem('2048-best', String(best));
            return best;
          });
          if (hasWon(result.board) && !won) setWon(true);
          setTimeout(() => {
            if (isGameOver(result.board)) setGameOver(true);
          }, 150);
          return newScore;
        });
      }
      return result.board;
    });
  }, [gameOver, won]);

  useEffect(() => {
    function handleKey(e) {
      const dirMap = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right' };
      const dir = dirMap[e.key];
      if (dir) { e.preventDefault(); handleMove(dir); }
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [handleMove]);

  // Touch support
  const touchRef = { startX: 0, startY: 0 };
  const onTouchStart = useCallback((e) => {
    touchRef.startX = e.touches[0].clientX;
    touchRef.startY = e.touches[0].clientY;
  }, []);
  const onTouchEnd = useCallback((e) => {
    const dx = e.changedTouches[0].clientX - touchRef.startX;
    const dy = e.changedTouches[0].clientY - touchRef.startY;
    if (Math.abs(dx) < 20 && Math.abs(dy) < 20) return;
    if (Math.abs(dx) > Math.abs(dy)) {
      handleMove(dx > 0 ? 'right' : 'left');
    } else {
      handleMove(dy > 0 ? 'down' : 'up');
    }
  }, [handleMove]);

  const newGame = () => {
    setBoard(createBoard());
    setScore(0);
    setGameOver(false);
    setWon(false);
  };

  return (
    <div className="mx-auto max-w-md">
      <Link to="/games" className="inline-flex items-center gap-1 text-sm text-text-muted hover:text-text transition-colors mb-4">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
        返回游戏列表
      </Link>

      <div className="flex items-center justify-between mb-5">
        <h1 className="text-2xl font-bold">2048</h1>
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-surface-alt px-3 py-1.5 text-center min-w-[64px]">
            <div className="text-[10px] text-text-muted uppercase tracking-wide">分数</div>
            <div className="font-bold text-primary-light text-lg">{score}</div>
          </div>
          <div className="rounded-lg bg-surface-alt px-3 py-1.5 text-center min-w-[64px]">
            <div className="text-[10px] text-text-muted uppercase tracking-wide">最高</div>
            <div className="font-bold text-text-muted">{bestScore}</div>
          </div>
          <button onClick={newGame}
            className="rounded-lg bg-primary px-3.5 py-2 text-sm font-medium text-white hover:bg-primary-dark transition-colors">
            新游戏
          </button>
        </div>
      </div>

      {/* Grid */}
      <div
        className="relative rounded-xl p-3 select-none"
        style={{ background: '#1a1a2e' }}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        {/* Background grid squares */}
        <div className="grid grid-cols-4 gap-2.5">
          {Array.from({ length: 16 }).map((_, i) => (
            <div key={`bg-${i}`} className="rounded-lg aspect-square" style={{ background: '#25253d' }} />
          ))}
        </div>

        {/* Tiles overlay */}
        <div className="absolute inset-3 grid grid-cols-4 gap-2.5">
          {board.flat().map((value, i) => (
            <div key={i} style={tileStyle(value)}>
              {value !== 0 && value}
            </div>
          ))}
        </div>

        {/* Overlay */}
        {(gameOver || won) && (
          <div className="absolute inset-0 flex flex-col items-center justify-center rounded-xl z-10" style={{ background: 'rgba(17,17,25,0.85)' }}>
            <p className={`text-2xl font-bold mb-2 ${won ? 'text-yellow-400' : 'text-red-400'}`}>
              {won ? '你赢了！' : '游戏结束'}
            </p>
            <p className="text-white/70 text-sm mb-4">分数: {score}</p>
            <button onClick={newGame}
              className="rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-white hover:bg-primary-dark transition-colors">
              再玩一次
            </button>
          </div>
        )}
      </div>

      <div className="mt-4 text-sm text-text-muted space-y-1">
        <p>使用 <kbd className="px-1.5 py-0.5 rounded bg-surface-alt text-xs">方向键</kbd> 移动方格，支持触屏滑动</p>
        <p className="text-xs">合并相同数字，达到 <strong className="text-accent">2048</strong> 即为胜利！</p>
      </div>
    </div>
  );
}
