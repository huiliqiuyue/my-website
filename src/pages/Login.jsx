import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router';
import { useAuth } from '../contexts/AuthContext';

export default function Login() {
  const [tab, setTab] = useState('login'); // 'login' | 'register'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from || '/';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      if (tab === 'login') {
        await signIn(email, password);
      } else {
        await signUp(email, password, displayName);
      }
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message || '操作失败，请重试');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-md pt-8">
      <Link to="/" className="inline-flex items-center gap-1 text-sm text-text-muted hover:text-text transition-colors mb-6">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
        返回首页
      </Link>

      <h1 className="text-2xl font-bold mb-6">{tab === 'login' ? '登录' : '注册'}</h1>

      {/* Tab switcher */}
      <div className="flex rounded-lg bg-surface-alt p-0.5 mb-6">
        <button
          onClick={() => { setTab('login'); setError(''); }}
          className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
            tab === 'login' ? 'bg-surface text-text shadow-sm' : 'text-text-muted hover:text-text'
          }`}
        >
          登录
        </button>
        <button
          onClick={() => { setTab('register'); setError(''); }}
          className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
            tab === 'register' ? 'bg-surface text-text shadow-sm' : 'text-text-muted hover:text-text'
          }`}
        >
          注册
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-red-500/10 border border-red-500/30 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {tab === 'register' && (
          <div>
            <label className="block text-sm font-medium text-text mb-1.5">昵称</label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full rounded-lg border border-border bg-surface-alt px-4 py-2.5 text-sm text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-colors"
              placeholder="你的昵称"
              required
            />
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-text mb-1.5">邮箱</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border border-border bg-surface-alt px-4 py-2.5 text-sm text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-colors"
            placeholder="your@email.com"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-text mb-1.5">密码</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg border border-border bg-surface-alt px-4 py-2.5 text-sm text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-colors"
            placeholder="至少6位"
            required
            minLength={6}
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-lg bg-primary py-2.5 text-sm font-medium text-white hover:bg-primary-dark transition-colors disabled:opacity-50"
        >
          {submitting ? '处理中...' : tab === 'login' ? '登录' : '注册'}
        </button>
      </form>

      {tab === 'register' && (
        <p className="mt-4 text-xs text-text-muted text-center">
          注册即表示同意本站的服务条款。注册后请联系管理员升级为管理员权限。
        </p>
      )}
    </div>
  );
}
