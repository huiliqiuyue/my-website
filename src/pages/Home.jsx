import { Link } from 'react-router';
import { usePosts } from '../hooks/usePosts';
import BlogCard from '../components/BlogCard';

export default function Home() {
  const { posts } = usePosts();
  const latestPosts = posts.slice(0, 3);

  return (
    <div>
      {/* Hero */}
      <section className="py-20 sm:py-28 text-center">
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight mb-5">
          你好，我是一名<span className="text-primary-light">开发者</span>
        </h1>
        <p className="text-lg sm:text-xl text-text-muted max-w-2xl mx-auto mb-10 leading-relaxed">
          写代码、做产品、分享技术。欢迎来到我的数字小天地。
        </p>
        <div className="flex items-center justify-center gap-3 flex-wrap">
          <Link to="/blog" className="inline-flex items-center rounded-lg bg-primary px-6 py-3 text-sm font-medium text-white hover:bg-primary-dark transition-all shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30">
            阅读博客
          </Link>
          <Link to="/games" className="inline-flex items-center rounded-lg border border-border bg-surface px-6 py-3 text-sm font-medium text-text hover:bg-surface-alt transition-all hover:border-primary/30">
            玩玩小游戏
          </Link>
          <Link to="/about" className="inline-flex items-center rounded-lg border border-border bg-surface px-6 py-3 text-sm font-medium text-text hover:bg-surface-alt transition-all hover:border-primary/30">
            关于我
          </Link>
        </div>
      </section>

      {/* Latest Posts */}
      <section className="mb-16">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">最新文章</h2>
          <Link to="/blog" className="text-sm text-accent hover:text-primary-light transition-colors">
            查看全部 &rarr;
          </Link>
        </div>
        {latestPosts.length > 0 ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {latestPosts.map((post) => (
              <BlogCard key={post.slug} post={post} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 rounded-xl border border-border bg-surface">
            <p className="text-text-muted">还没有文章，稍后再来看看。</p>
          </div>
        )}
      </section>

      {/* Games teaser */}
      <section className="mb-16">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">小游戏</h2>
          <Link to="/games" className="text-sm text-accent hover:text-primary-light transition-colors">
            全部游戏 &rarr;
          </Link>
        </div>
        <div className="grid gap-5 sm:grid-cols-3">
          {[
            { title: '贪吃蛇', desc: '经典街机游戏，吃食物变长，别撞到自己！', emoji: '🐍', to: '/games/snake' },
            { title: '2048', desc: '合并相同数字，挑战 2048！', emoji: '🧩', to: '/games/2048' },
            { title: '扫雷', desc: '用逻辑推理找出所有地雷。', emoji: '💣', to: '/games/minesweeper' },
          ].map((game) => (
            <Link key={game.to} to={game.to}
              className="group flex flex-col items-center rounded-xl border border-border bg-surface p-6 text-center transition-all hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-0.5"
            >
              <span className="text-4xl mb-3">{game.emoji}</span>
              <h3 className="font-semibold text-text group-hover:text-primary-light transition-colors mb-1">{game.title}</h3>
              <p className="text-xs text-text-muted">{game.desc}</p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
