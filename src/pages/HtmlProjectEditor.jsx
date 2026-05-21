import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

export default function HtmlProjectEditor() {
  const { id } = useParams();
  const isEditing = Boolean(id);
  const { user } = useAuth();
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [content, setContent] = useState(`<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>我的作品</title>
  <style>
    body { font-family: system-ui, sans-serif; padding: 20px; text-align: center; }
    h1 { color: #6366f1; }
  </style>
</head>
<body>
  <h1>Hello, World!</h1>
  <p>在这里创作你的 HTML 作品</p>
</body>
</html>`);
  const [preview, setPreview] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(isEditing);

  useEffect(() => {
    if (!isEditing) return;
    (async () => {
      const { data } = await supabase
        .from('html_projects')
        .select('*')
        .eq('id', id)
        .single();
      if (data) {
        if (data.author_id !== user.id) {
          const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
          if (profile?.role !== 'admin') { setError('无权编辑'); setLoading(false); return; }
        }
        setTitle(data.title);
        setDescription(data.description || '');
        setContent(data.content);
      }
      setLoading(false);
    })();
  }, [id, isEditing, user.id]);

  const handleSave = async () => {
    if (!title.trim()) { setError('请输入标题'); return; }
    setSaving(true);
    setError('');

    const payload = { title: title.trim(), description: description.trim(), content, author_id: user.id };

    const { error: saveError } = isEditing
      ? await supabase.from('html_projects').update(payload).eq('id', id)
      : await supabase.from('html_projects').insert(payload).select('id').single();

    if (!saveError) {
      navigate(isEditing ? `/showcase/${id}` : '/showcase');
    } else {
      setError(saveError.message);
    }
    setSaving(false);
  };

  if (loading) {
    return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  }

  return (
    <div className="mx-auto max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <Link to={isEditing ? `/showcase/${id}` : '/showcase'} className="inline-flex items-center gap-1 text-sm text-text-muted hover:text-text transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
          返回
        </Link>
        <div className="flex items-center gap-2">
          <button onClick={() => setPreview(!preview)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${preview ? 'bg-surface-alt text-text' : 'bg-primary text-white hover:bg-primary-dark'}`}
          >
            {preview ? '编辑' : '预览'}
          </button>
          <button onClick={handleSave} disabled={saving}
            className="rounded-lg bg-primary px-4 py-1.5 text-sm font-medium text-white hover:bg-primary-dark transition-colors disabled:opacity-50"
          >
            {saving ? '保存中...' : isEditing ? '保存修改' : '发布作品'}
          </button>
        </div>
      </div>

      <h1 className="text-2xl font-bold mb-6">{isEditing ? '编辑作品' : '上传 HTML 作品'}</h1>

      {error && <div className="mb-4 rounded-lg bg-red-500/10 border border-red-500/30 px-4 py-3 text-sm text-red-400">{error}</div>}

      {preview ? (
        <div className="rounded-xl border border-border overflow-hidden bg-white h-[600px]">
          <iframe srcDoc={content} sandbox="allow-scripts allow-same-origin" className="w-full h-full border-0" title="预览" />
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-text mb-1.5">作品名称</label>
              <input type="text" value={title} onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded-lg border border-border bg-surface-alt px-4 py-2.5 text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/50 transition-colors"
                placeholder="我的作品"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text mb-1.5">简介（可选）</label>
              <input type="text" value={description} onChange={(e) => setDescription(e.target.value)}
                className="w-full rounded-lg border border-border bg-surface-alt px-4 py-2.5 text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/50 transition-colors"
                placeholder="一句话描述你的作品"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-text mb-1.5">HTML 代码</label>
            <textarea value={content} onChange={(e) => setContent(e.target.value)}
              className="w-full rounded-lg border border-border bg-surface-alt px-4 py-3 text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/50 transition-colors font-mono"
              rows={22} spellCheck={false}
            />
          </div>

          <div className="rounded-lg bg-surface-alt border border-border px-4 py-3 text-xs text-text-muted">
            <strong className="text-text">安全说明：</strong> 你的代码会在一个隔离的沙盒（sandbox）中运行。
            脚本可以执行但无法访问主站的 cookie、localStorage 和 DOM。
          </div>
        </div>
      )}
    </div>
  );
}
