import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

export default function AdminUsers() {
  const { isAdmin } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchUsers = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });
    if (data) setUsers(data);
    setLoading(false);
  };

  useEffect(() => { fetchUsers(); }, []);

  const toggleBan = async (userId, currentlyBanned) => {
    await supabase
      .from('profiles')
      .update({ banned: !currentlyBanned })
      .eq('id', userId);
    fetchUsers();
  };

  if (!isAdmin) {
    return (
      <div className="text-center py-20">
        <p className="text-text-muted">无权访问此页面</p>
        <Link to="/" className="text-accent hover:text-primary-light transition-colors text-sm">返回首页</Link>
      </div>
    );
  }

  const filtered = users.filter((u) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (u.display_name || '').toLowerCase().includes(q) ||
           (u.id || '').toLowerCase().includes(q);
  });

  return (
    <div className="mx-auto max-w-2xl">
      <Link to="/" className="inline-flex items-center gap-1 text-sm text-text-muted hover:text-text transition-colors mb-4">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
        返回首页
      </Link>

      <h1 className="text-2xl font-bold mb-6">用户管理</h1>

      <input type="text" placeholder="搜索用户..." value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full rounded-lg border border-border bg-surface-alt px-4 py-2.5 text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/50 transition-colors mb-4"
      />

      {loading ? (
        <div className="text-center py-8 text-text-muted">加载中...</div>
      ) : (
        <div className="space-y-2">
          {filtered.map((u) => (
            <div key={u.id} className="flex items-center justify-between rounded-lg border border-border bg-surface px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary-light overflow-hidden">
                  {u.avatar_url ? <img src={u.avatar_url} alt="" className="w-full h-full object-cover" /> : (u.display_name || '?')[0].toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-text">{u.display_name || '未命名'}</span>
                    {u.role === 'admin' && <span className="text-[10px] bg-primary/20 text-primary-light px-1.5 py-0.5 rounded">管理员</span>}
                    {u.banned && <span className="text-[10px] bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded">已封禁</span>}
                  </div>
                  <span className="text-xs text-text-muted">{u.id?.slice(0, 8)}...</span>
                </div>
              </div>
              {u.role !== 'admin' && (
                <button
                  onClick={() => toggleBan(u.id, u.banned)}
                  className={`text-xs px-3 py-1 rounded-md font-medium transition-colors ${
                    u.banned
                      ? 'bg-green-500/15 text-green-400 hover:bg-green-500/25'
                      : 'bg-red-500/15 text-red-400 hover:bg-red-500/25'
                  }`}
                >
                  {u.banned ? '解封' : '封禁'}
                </button>
              )}
            </div>
          ))}
          {filtered.length === 0 && (
            <p className="text-center py-8 text-text-muted text-sm">未找到用户</p>
          )}
        </div>
      )}
    </div>
  );
}
