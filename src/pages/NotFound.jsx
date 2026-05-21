import { Link } from 'react-router';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="text-7xl mb-4">404</div>
      <h1 className="text-2xl font-bold mb-2">页面不存在</h1>
      <p className="text-text-muted mb-8 max-w-md">
        你访问的页面不存在或已被移动。
      </p>
      <div className="flex gap-3">
        <Link to="/" className="rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-white hover:bg-primary-dark transition-colors">
          返回首页
        </Link>
        <Link to="/blog" className="rounded-lg border border-border bg-surface px-5 py-2.5 text-sm font-medium text-text hover:bg-surface-alt transition-colors">
          阅读博客
        </Link>
      </div>
    </div>
  );
}
