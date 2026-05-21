import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

export default function CommentSection({ postSlug }) {
  const { user, isAdmin } = useAuth();
  const [comments, setComments] = useState([]);
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchComments = async () => {
    const { data } = await supabase
      .from('comments')
      .select('*, profiles(display_name, avatar_url)')
      .eq('post_slug', postSlug)
      .order('created_at', { ascending: true });
    if (data) setComments(data);
    setLoading(false);
  };

  useEffect(() => { fetchComments(); }, [postSlug]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;
    setSubmitting(true);
    const { error } = await supabase
      .from('comments')
      .insert({ post_slug: postSlug, author_id: user.id, content: content.trim() });
    setSubmitting(false);
    if (!error) {
      setContent('');
      fetchComments();
    }
  };

  const handleDelete = async (id) => {
    await supabase.from('comments').delete().eq('id', id);
    fetchComments();
  };

  return (
    <div className="mt-12 pt-8 border-t border-border">
      <h2 className="text-xl font-bold mb-6">评论 ({comments.length})</h2>

      {user ? (
        <form onSubmit={handleSubmit} className="mb-8 flex gap-3">
          <textarea value={content} onChange={(e) => setContent(e.target.value)}
            className="flex-1 rounded-lg border border-border bg-surface-alt px-4 py-2.5 text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/50 transition-colors resize-none"
            rows={3} placeholder="写下你的评论..."
          />
          <button type="submit" disabled={submitting || !content.trim()}
            className="self-end rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark transition-colors disabled:opacity-50 shrink-0"
          >
            发送
          </button>
        </form>
      ) : (
        <div className="mb-8 rounded-lg bg-surface-alt px-4 py-3 text-sm text-text-muted text-center">
          <Link to="/login" className="text-primary-light hover:underline">登录</Link> 后即可评论
        </div>
      )}

      {loading ? (
        <div className="text-center py-8 text-text-muted text-sm">加载中...</div>
      ) : comments.length === 0 ? (
        <p className="text-text-muted text-sm text-center py-8">暂无评论，来写第一条吧</p>
      ) : (
        <div className="space-y-4">
          {comments.map((c) => (
            <div key={c.id} className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary-light shrink-0 overflow-hidden">
                {c.profiles?.avatar_url ? (
                  <img src={c.profiles.avatar_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  (c.profiles?.display_name || '?')[0].toUpperCase()
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium text-text">{c.profiles?.display_name || '匿名'}</span>
                  <span className="text-xs text-text-muted">
                    {new Date(c.created_at).toLocaleDateString('zh-CN')}
                  </span>
                  {(user && (user.id === c.author_id || isAdmin)) && (
                    <button onClick={() => handleDelete(c.id)}
                      className="text-xs text-text-muted hover:text-red-400 transition-colors ml-auto"
                    >删除</button>
                  )}
                </div>
                <p className="text-sm text-text-muted leading-relaxed break-words">{c.content}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
