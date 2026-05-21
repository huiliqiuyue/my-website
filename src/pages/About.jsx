import { useState, useEffect, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

const defaultContent = `## 你好！

我是一名热爱技术的开发者，专注于 Web 前端开发。
喜欢用现代化的技术栈构建简洁、高效、用户体验优秀的产品。

---

### 技术栈

JavaScript, TypeScript, React, Vue, Node.js,
Python, HTML, CSS, Tailwind CSS, Git, Vite, Next.js

---

### 工作经历

- **高级前端工程师** @ 某科技公司 (2024 - 至今)
- **前端开发工程师** @ 某创业公司 (2022 - 2024)
- **初级开发工程师** @ 某数字营销公司 (2020 - 2022)
`;

export default function About() {
  const { isAdmin } = useAuth();
  const [content, setContent] = useState(defaultContent);
  const [github, setGithub] = useState('https://github.com');
  const [email, setEmail] = useState('hello@example.com');
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState('');
  const [editGithub, setEditGithub] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const fetchContent = useCallback(async () => {
    const { data } = await supabase
      .from('about_content')
      .select('*')
      .eq('id', 1)
      .single();
    if (data) {
      setContent(data.content || defaultContent);
      setGithub(data.github || 'https://github.com');
      setEmail(data.email || 'hello@example.com');
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchContent(); }, [fetchContent]);

  const startEdit = () => {
    setEditContent(content);
    setEditGithub(github);
    setEditEmail(email);
    setEditing(true);
    setError('');
  };

  const cancelEdit = () => {
    setEditing(false);
  };

  const saveEdit = async () => {
    setSaving(true);
    setError('');
    const { error: saveError } = await supabase
      .from('about_content')
      .update({ content: editContent, github: editGithub, email: editEmail })
      .eq('id', 1);

    if (!saveError) {
      setContent(editContent);
      setGithub(editGithub);
      setEmail(editEmail);
      setEditing(false);
    } else {
      setError(saveError.message);
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">关于我</h1>
        {isAdmin && !editing && (
          <button onClick={startEdit}
            className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-sm text-text-muted hover:text-text hover:border-primary/40 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
            编辑
          </button>
        )}
      </div>

      {editing ? (
        <div className="space-y-4">
          {error && (
            <div className="rounded-lg bg-red-500/10 border border-red-500/30 px-4 py-3 text-sm text-red-400">{error}</div>
          )}

          <div>
            <label className="block text-sm font-medium text-text mb-1.5">个人介绍（Markdown）</label>
            <textarea value={editContent} onChange={(e) => setEditContent(e.target.value)}
              className="w-full rounded-lg border border-border bg-surface-alt px-4 py-3 text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/50 transition-colors font-mono"
              rows={14}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-text mb-1.5">GitHub 地址</label>
              <input type="url" value={editGithub} onChange={(e) => setEditGithub(e.target.value)}
                className="w-full rounded-lg border border-border bg-surface-alt px-4 py-2.5 text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/50 transition-colors"
                placeholder="https://github.com/yourname"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text mb-1.5">Email</label>
              <input type="email" value={editEmail} onChange={(e) => setEditEmail(e.target.value)}
                className="w-full rounded-lg border border-border bg-surface-alt px-4 py-2.5 text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/50 transition-colors"
                placeholder="your@email.com"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <button onClick={saveEdit} disabled={saving}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark transition-colors disabled:opacity-50"
            >
              {saving ? '保存中...' : '保存'}
            </button>
            <button onClick={cancelEdit}
              className="rounded-lg border border-border px-4 py-2 text-sm text-text-muted hover:text-text transition-colors"
            >
              取消
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="prose mb-12">
            <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]}>
              {content}
            </ReactMarkdown>
          </div>

          {/* Contact section - populated from editable fields */}
          <h2 className="text-xl font-semibold mb-4">联系方式</h2>
          <div className="flex gap-3">
            <a href={github} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-4 py-2.5 text-sm text-text hover:bg-surface-alt hover:border-primary/30 transition-all"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg>
              GitHub
            </a>
            <a href={`mailto:${email}`}
              className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-4 py-2.5 text-sm text-text hover:bg-surface-alt hover:border-primary/30 transition-all"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M22 4L12 13 2 4"/></svg>
              Email
            </a>
          </div>
        </>
      )}
    </div>
  );
}
