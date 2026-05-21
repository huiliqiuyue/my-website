import { Link } from 'react-router';

const games = [
  {
    title: '贪吃蛇', emoji: '🐍',
    desc: '经典街机游戏。控制蛇的方向，吃掉食物不断变长，不要撞墙或撞到自己。',
    to: '/games/snake',
    color: 'from-green-500/15 to-emerald-500/5',
    border: 'hover:border-green-500/40',
  },
  {
    title: '2048', emoji: '🧩',
    desc: '滑动合并数字方块。相同数字合并加倍，挑战达到 2048！',
    to: '/games/2048',
    color: 'from-amber-500/15 to-yellow-500/5',
    border: 'hover:border-amber-500/40',
  },
  {
    title: '扫雷', emoji: '💣',
    desc: '经典逻辑推理游戏。通过数字线索找出所有隐藏的地雷，小心别踩雷！',
    to: '/games/minesweeper',
    color: 'from-red-500/15 to-rose-500/5',
    border: 'hover:border-red-500/40',
  },
  {
    title: '无限跑酷', emoji: '🏃',
    desc: 'Chrome 恐龙风格跑酷。跳跃躲避障碍，速度越来越快，挑战最高分！',
    to: '/games/runner',
    color: 'from-purple-500/15 to-violet-500/5',
    border: 'hover:border-purple-500/40',
  },
];

export default function GamesHub() {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-2">小游戏</h1>
      <p className="text-text-muted mb-8">休息一下，来玩几个经典小游戏吧。</p>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {games.map((game) => (
          <Link key={game.to} to={game.to}
            className={`group flex flex-col rounded-xl border border-border bg-gradient-to-b ${game.color} p-6 transition-all hover:shadow-lg hover:-translate-y-0.5 ${game.border}`}
          >
            <span className="text-5xl mb-4">{game.emoji}</span>
            <h3 className="text-lg font-semibold text-text group-hover:text-primary-light transition-colors mb-2">
              {game.title}
            </h3>
            <p className="text-sm text-text-muted leading-relaxed">{game.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
