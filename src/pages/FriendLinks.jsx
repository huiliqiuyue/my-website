import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export default function FriendLinks() {
  const { user, profile } = useAuth();
  const canManage = profile?.role === 'admin' || profile?.role === 'vip';

  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Form state
  const [formTitle, setFormTitle] = useState('');
  const [formUrl, setFormUrl] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formAvatar, setFormAvatar] = useState('');

  const fetchLinks = useCallback(async () => {
    const { data } = await supabase
      .from('friend_links')
      .select('*')
      .eq('approved', true)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false });
    setLinks(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchLinks(); }, [fetchLinks]);

  const openAdd = () => {
    setEditingId(null);
    setFormTitle('');
    setFormUrl('');
    setFormDesc('');
    setFormAvatar('');
    setError('');
    setModalOpen(true);
  };

  const openEdit = (link) => {
    setEditingId(link.id);
    setFormTitle(link.title);
    setFormUrl(link.url);
    setFormDesc(link.description || '');
    setFormAvatar(link.avatar_url || '');
    setError('');
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingId(null);
  };

  const handleSave = async () => {
    if (!formTitle.trim() || !formUrl.trim()) {
      setError('网站名称和链接为必填项');
      return;
    }
    setSaving(true);
    setError('');

    const payload = {
      title: formTitle.trim(),
      url: formUrl.trim(),
      description: formDesc.trim(),
      avatar_url: formAvatar.trim(),
    };

    if (editingId) {
      const { error: saveError } = await supabase
        .from('friend_links')
        .update(payload)
        .eq('id', editingId);
      if (saveError) { setError(saveError.message); setSaving(false); return; }
    } else {
      const { error: saveError } = await supabase
        .from('friend_links')
        .insert({ ...payload, created_by: user.id });
      if (saveError) { setError(saveError.message); setSaving(false); return; }
    }

    setSaving(false);
    closeModal();
    fetchLinks();
  };

  const handleDelete = async (id) => {
    if (!confirm('确定要删除这个友链吗？')) return;
    await supabase.from('friend_links').delete().eq('id', id);
    fetchLinks();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">友链</h1>
        {canManage && (
          <button onClick={openAdd}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            添加友链
          </button>
        )}
      </div>

      {links.length === 0 ? (
        <div className="rounded-xl border border-border bg-surface py-16 text-center">
          <p className="text-text-muted text-sm">暂无友链，欢迎来添加~</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {links.map((link) => (
            <div key={link.id}
              className="group relative rounded-xl border border-border bg-surface p-5 hover:border-primary/30 hover:shadow-lg transition-all"
            >
              {canManage && (
                <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => openEdit(link)}
                    className="rounded-md p-1.5 text-text-muted hover:text-text hover:bg-surface-alt transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                  </button>
                  <button onClick={() => handleDelete(link.id)}
                    className="rounded-md p-1.5 text-text-muted hover:text-red-400 hover:bg-red-400/10 transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
                  </button>
                </div>
              )}

              <a href={link.url} target="_blank" rel="noopener noreferrer" className="flex items-start gap-4">
                {link.avatar_url ? (
                  <img src={link.avatar_url} alt="" className="w-12 h-12 rounded-xl object-cover shrink-0 bg-surface-alt" />
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></svg>
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-text text-base truncate">{link.title}</h3>
                  {link.description && (
                    <p className="text-text-muted text-sm mt-1 line-clamp-2">{link.description}</p>
                  )}
                </div>
              </a>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4" onClick={closeModal}>
          <div className="w-full max-w-md rounded-2xl border border-border bg-surface p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-semibold mb-4">{editingId ? '编辑友链' : '添加友链'}</h2>

            {error && (
              <div className="rounded-lg bg-red-500/10 border border-red-500/30 px-3 py-2 text-sm text-red-400 mb-4">{error}</div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text mb-1.5">网站名称 *</label>
                <input type="text" value={formTitle} onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full rounded-lg border border-border bg-surface-alt px-3 py-2.5 text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/50 transition-colors"
                  placeholder="朋友的博客"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text mb-1.5">链接 *</label>
                <input type="url" value={formUrl} onChange={(e) => setFormUrl(e.target.value)}
                  className="w-full rounded-lg border border-border bg-surface-alt px-3 py-2.5 text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/50 transition-colors"
                  placeholder="https://example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text mb-1.5">描述</label>
                <input type="text" value={formDesc} onChange={(e) => setFormDesc(e.target.value)}
                  className="w-full rounded-lg border border-border bg-surface-alt px-3 py-2.5 text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/50 transition-colors"
                  placeholder="一句话介绍这个网站"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text mb-1.5">头像链接</label>
                <input type="url" value={formAvatar} onChange={(e) => setFormAvatar(e.target.value)}
                  className="w-full rounded-lg border border-border bg-surface-alt px-3 py-2.5 text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/50 transition-colors"
                  placeholder="https://example.com/avatar.png（可选）"
                />
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <button onClick={handleSave} disabled={saving}
                className="flex-1 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white hover:bg-primary-dark transition-colors disabled:opacity-50"
              >
                {saving ? '保存中...' : '保存'}
              </button>
              <button onClick={closeModal}
                className="flex-1 rounded-lg border border-border px-4 py-2.5 text-sm text-text-muted hover:text-text transition-colors"
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
