import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

export default function AdminUsers() {
  const { isAdmin, profile: myProfile } = useAuth();
  const isVip = myProfile?.role === 'vip';
  const canManage = isAdmin || isVip;

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
    if (!isAdmin && !isVip) return;
    await supabase
      .from('profiles')
      .update({ banned: !currentlyBanned })
      .eq('id', userId);
    fetchUsers();
  };

  const setRole = async (userId, newRole) => {
    if (!isAdmin) return; // Only admin can change roles
    await supabase
      .from('profiles')
      .update({ role: newRole })
      .eq('id', userId);
    fetchUsers();
  };

  if (!canManage) {
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
    return (u.display_name || '').toLowerCase().includes(q);
  });

  const canBanThis = (targetUser) => {
    if (!isVip && !isAdmin) return false;
    if (targetUser.role === 'admin') return false; // Never ban admin
    if (isVip && targetUser.role === 'vip') return false; // VIP can't ban VIP
    if (targetUser.id === myProfile?.id) return false; // Can't ban self
    return true;
  };

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
            <div key={u.id} className="flex items-center justify-between rounded-lg border border-border bg-surface px-4 py-3 gap-3 flex-wrap">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary-light overflow-hidden shrink-0">
                  {u.avatar_url ? <img src={u.avatar_url} alt="" className="w-full h-full object-cover" /> : (u.display_name || '?')[0].toUpperCase()}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-medium text-text truncate">{u.display_name || '未命名'}</span>
                    {u.role === 'admin' && <span className="text-[10px] bg-primary/20 text-primary-light px-1.5 py-0.5 rounded shrink-0">管理员</span>}
                    {u.role === 'vip' && <span className="text-[10px] bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded shrink-0">VIP</span>}
                    {u.banned && <span className="text-[10px] bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded shrink-0">已封禁</span>}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                {/* Role selector - admin only */}
                {isAdmin && u.role !== 'admin' && (
                  <select
                    value={u.role}
                    onChange={(e) => setRole(u.id, e.target.value)}
                    className="text-xs rounded-md border border-border bg-surface-alt px-2 py-1 text-text focus:outline-none focus:ring-1 focus:ring-primary/50"
                  >
                    <option value="user">普通用户</option>
                    <option value="vip">VIP</option>
                    <option value="admin">管理员</option>
                  </select>
                )}

                {/* Ban button */}
                {canBanThis(u) && (
                  <button onClick={() => toggleBan(u.id, u.banned)}
                    className={`text-xs px-2.5 py-1 rounded-md font-medium transition-colors ${
                      u.banned
                        ? 'bg-green-500/15 text-green-400 hover:bg-green-500/25'
                        : 'bg-red-500/15 text-red-400 hover:bg-red-500/25'
                    }`}
                  >
                    {u.banned ? '解封' : '封禁'}
                  </button>
                )}
              </div>
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
