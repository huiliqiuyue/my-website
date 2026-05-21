import { useState, useCallback, useEffect, useRef } from 'react';
import { Link } from 'react-router';
import {
  DIFFICULTIES, createBoard, revealCell, toggleFlag, checkWin, countFlags,
} from '../games/minesweeper/engine';

const numberColors = [
  '', 'text-blue-400', 'text-green-400', 'text-red-400',
  'text-indigo-400', 'text-orange-400', 'text-cyan-400',
  'text-pink-400', 'text-gray-400',
];

const diffLabels = { beginner: '初级', intermediate: '中级', expert: '高级' };

export default function MinesweeperGame() {
  const [difficulty, setDifficulty] = useState('beginner');
  const { rows, cols, mines } = DIFFICULTIES[difficulty];
  const [board, setBoard] = useState(() => createBoard(rows, cols, mines));
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);
  const [timer, setTimer] = useState(0);
  const [started, setStarted] = useState(false);
  const timerRef = useRef(null);

  const newGame = useCallback(() => {
    const d = DIFFICULTIES[difficulty];
    setBoard(createBoard(d.rows, d.cols, d.mines));
    setGameOver(false);
    setWon(false);
    setTimer(0);
    setStarted(false);
    if (timerRef.current) clearInterval(timerRef.current);
  }, [difficulty]);

  useEffect(() => { newGame(); }, [difficulty, newGame]);

  useEffect(() => {
    if (started && !gameOver && !won) {
      timerRef.current = setInterval(() => setTimer((t) => t + 1), 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [started, gameOver, won]);

  const handleClick = useCallback((r, c) => {
    if (gameOver || won) return;
    if (!started) setStarted(true);
    setBoard((prev) => {
      const { board: newBoard, hitMine } = revealCell(prev, r, c);
      if (hitMine) setGameOver(true);
      else if (checkWin(newBoard)) setWon(true);
      return newBoard;
    });
  }, [gameOver, won, started]);

  const handleRightClick = useCallback((e, r, c) => {
    e.preventDefault();
    if (gameOver || won) return;
    if (!started) setStarted(true);
    setBoard((prev) => toggleFlag(prev, r, c));
  }, [gameOver, won, started]);

  const flagCount = countFlags(board);
  const remaining = mines - flagCount;
  const cellSize = difficulty === 'expert'
    ? 'text-[11px]'
    : 'text-sm';

  const cellBase = `flex items-center justify-center rounded font-bold select-none transition-colors cursor-pointer ${cellSize}`;

  return (
    <div className="mx-auto max-w-2xl">
      <Link to="/games" className="inline-flex items-center gap-1 text-sm text-text-muted hover:text-text transition-colors mb-4">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
        返回游戏列表
      </Link>

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-5">
        <h1 className="text-2xl font-bold">扫雷</h1>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex rounded-lg bg-surface-alt p-0.5">
            {Object.entries(diffLabels).map(([key, label]) => (
              <button key={key} onClick={() => setDifficulty(key)}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                  difficulty === key ? 'bg-primary text-white' : 'text-text-muted hover:text-text'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-4 text-sm">
            <span className="text-text-muted">剩余: <span className="text-text font-bold">{remaining}</span></span>
            <span className="text-text-muted">时间: <span className="text-text font-bold">{timer}秒</span></span>
          </div>
          <button onClick={newGame}
            className="rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-white hover:bg-primary-dark transition-colors">
            新游戏
          </button>
        </div>
      </div>

      <div className="relative overflow-x-auto rounded-xl border border-border bg-surface p-3 shadow-lg">
        <div className="grid gap-[2px] mx-auto w-fit" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
          {board.flat().map((cell, i) => {
            const r = Math.floor(i / cols);
            const c = i % cols;

            let cellStyle = { background: '#3a3a55' };
            if (cell.revealed && cell.mine) cellStyle = { background: 'rgba(239,68,68,0.3)' };
            else if (cell.revealed && !cell.mine) cellStyle = { background: '#25253d' };

            return (
              <button key={i}
                onClick={() => handleClick(r, c)}
                onContextMenu={(e) => handleRightClick(e, r, c)}
                className={cellBase}
                style={{ ...cellStyle, width: difficulty === 'expert' ? 28 : 36, height: difficulty === 'expert' ? 28 : 36 }}
              >
                {cell.flagged && !cell.revealed && <span className="text-red-400 text-xs">🚩</span>}
                {cell.revealed && cell.mine && <span className="text-xs">💣</span>}
                {cell.revealed && !cell.mine && cell.adjacent > 0 && (
                  <span className={numberColors[cell.adjacent] || ''}>{cell.adjacent}</span>
                )}
              </button>
            );
          })}
        </div>

        {(gameOver || won) && (
          <div className="absolute inset-0 flex flex-col items-center justify-center rounded-xl bg-black/75 gap-3 z-10">
            <p className={`text-2xl font-bold ${won ? 'text-green-400' : 'text-red-400'}`}>
              {won ? '🎉 你赢了！' : '💥 踩雷了！'}
            </p>
            <p className="text-white/70 text-sm">用时: {timer}秒</p>
            <button onClick={newGame}
              className="rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-white hover:bg-primary-dark transition-colors">
              再玩一次
            </button>
          </div>
        )}
      </div>

      <div className="mt-4 text-sm text-text-muted">
        <p><kbd className="px-1.5 py-0.5 rounded bg-surface-alt text-xs">左键</kbd> 翻开 &emsp; <kbd className="px-1.5 py-0.5 rounded bg-surface-alt text-xs">右键</kbd> 标记旗帜</p>
      </div>
    </div>
  );
}
