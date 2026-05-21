import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

export default function BlogEditor() {
  const { slug } = useParams(); // undefined = new post, string = edit existing
  const isEditing = Boolean(slug);
  const { user } = useAuth();
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState('');
  const [category, setCategory] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [preview, setPreview] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(isEditing);
  const [importing, setImporting] = useState(false);

  const handleImportMd = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImporting(true);

    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target.result;

      // Parse frontmatter if present
      const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
      if (match) {
        const yamlStr = match[1];
        const body = match[2];

        // Parse YAML
        const data = {};
        let currentKey = null;
        for (const line of yamlStr.split('\n')) {
          const listMatch = line.match(/^\s{2}-\s+(.+)/);
          if (listMatch && currentKey) {
            data[currentKey] = data[currentKey] || [];
            data[currentKey].push(listMatch[1].replace(/^"(.*)"$/, '$1').replace(/^'(.*)'$/, '$1'));
            continue;
          }
          const inlineList = line.match(/^(\w+):\s*\[(.+)\]$/);
          if (inlineList) {
            data[inlineList[1]] = inlineList[2].split(',').map(s => s.trim().replace(/^"(.*)"$/, '$1').replace(/^'(.*)'$/, '$1'));
            continue;
          }
          const kv = line.match(/^(\w+):\s*(.+)/);
          if (kv) {
            currentKey = kv[1];
            let v = kv[2].trim().replace(/^"(.*)"$/, '$1').replace(/^'(.*)'$/, '$1');
            data[currentKey] = v;
          }
        }

        if (data.title && !title) setTitle(data.title);
        if (data.tags) setTags(Array.isArray(data.tags) ? data.tags.join(', ') : data.tags);
        if (data.category) setCategory(data.category);
        if (data.excerpt) setExcerpt(data.excerpt);
        setContent(body);
      } else {
        // No frontmatter — use filename as title, whole content as body
        if (!title) setTitle(file.name.replace(/\.md$/i, ''));
        setContent(text);
      }
      setImporting(false);
    };
    reader.readAsText(file);
    e.target.value = ''; // reset input
  };

  // Load existing post for editing
  useEffect(() => {
    if (!isEditing) return;
    (async () => {
      const { data, error: err } = await supabase
        .from('posts')
        .select('*')
        .eq('slug', slug)
        .single();
      if (err || !data) {
        setError('文章未找到');
        setLoading(false);
        return;
      }
      // Verify ownership or admin
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();
      if (data.author_id !== user.id && profile?.role !== 'admin') {
        setError('无权编辑此文章');
        setLoading(false);
        return;
      }
      setTitle(data.title);
      setContent(data.content);
      setTags((data.tags || []).join(', '));
      setCategory(data.category || '');
      setExcerpt(data.excerpt || '');
      setLoading(false);
    })();
  }, [isEditing, slug, user.id]);

  const generateSlug = (text) => {
    // Simple slug: lowercase, replace spaces with hyphens, remove non-alphanumeric (except hyphens)
    return text
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9一-鿿-]/g, '')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 80) || 'untitled';
  };

  const handleSave = async (publish = true) => {
    if (!title.trim()) { setError('标题不能为空'); return; }
    setError('');
    setSaving(true);

    const postData = {
      title: title.trim(),
      content,
      tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
      category: category.trim() || '未分类',
      excerpt: excerpt.trim() || content.slice(0, 150).replace(/[#*`\n]/g, ' ').trim(),
      author_id: user.id,
      published: publish,
    };

    try {
      if (isEditing) {
        const { error: err } = await supabase
          .from('posts')
          .update(postData)
          .eq('slug', slug);
        if (err) throw err;
        navigate(`/blog/${slug}`);
      } else {
        postData.slug = generateSlug(title);
        const { data, error: err } = await supabase
          .from('posts')
          .insert(postData)
          .select('slug')
          .single();
        if (err) {
          if (err.code === '23505') {
            setError('已存在相同标题的文章，请修改标题');
          } else {
            throw err;
          }
        } else {
          navigate(`/blog/${data.slug}`);
        }
      }
    } catch (err) {
      setError(err.message || '保存失败');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error && isEditing && !title) {
    return (
      <div className="text-center py-20">
        <p className="text-red-400 mb-4">{error}</p>
        <Link to="/blog" className="text-accent hover:text-primary-light transition-colors">&larr; 返回博客</Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <Link to={isEditing ? `/blog/${slug}` : '/blog'} className="inline-flex items-center gap-1 text-sm text-text-muted hover:text-text transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
          {isEditing ? '返回文章' : '返回博客'}
        </Link>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPreview(!preview)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
              preview ? 'bg-surface-alt text-text' : 'bg-primary text-white hover:bg-primary-dark'
            }`}
          >
            {preview ? '编辑' : '预览'}
          </button>
          <button
            onClick={() => handleSave(true)}
            disabled={saving}
            className="rounded-lg bg-primary px-4 py-1.5 text-sm font-medium text-white hover:bg-primary-dark transition-colors disabled:opacity-50"
          >
            {saving ? '保存中...' : '发布'}
          </button>
        </div>
      </div>

      <h1 className="text-2xl font-bold mb-2">{isEditing ? '编辑文章' : '写文章'}</h1>

      {!isEditing && (
        <div className="mb-5">
          <label className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-border px-3 py-2 text-xs text-text-muted hover:text-text hover:border-primary/40 hover:bg-surface-alt transition-colors cursor-pointer">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            {importing ? '导入中...' : '导入 .md 文件'}
            <input type="file" accept=".md,.mdx,.markdown" onChange={handleImportMd} className="hidden" />
          </label>
          <span className="text-xs text-text-muted ml-2">支持 YAML frontmatter（自动解析标题、标签、分类）</span>
        </div>
      )}

      {error && (
        <div className="mb-4 rounded-lg bg-red-500/10 border border-red-500/30 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {preview ? (
        <div className="rounded-xl border border-border bg-surface p-6">
          <h1 className="text-3xl font-bold mb-4">{title || '（无标题）'}</h1>
          <div className="prose">
            <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]}>
              {content || '（无内容）'}
            </ReactMarkdown>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text mb-1.5">标题</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-lg border border-border bg-surface-alt px-4 py-2.5 text-sm text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-colors"
              placeholder="文章标题"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-text mb-1.5">分类</label>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-lg border border-border bg-surface-alt px-4 py-2.5 text-sm text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-colors"
                placeholder="前端开发"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text mb-1.5">标签（用逗号分隔）</label>
              <input
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                className="w-full rounded-lg border border-border bg-surface-alt px-4 py-2.5 text-sm text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-colors"
                placeholder="react, javascript"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-text mb-1.5">摘要（可选，留空自动生成）</label>
            <input
              type="text"
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              className="w-full rounded-lg border border-border bg-surface-alt px-4 py-2.5 text-sm text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-colors"
              placeholder="文章摘要..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text mb-1.5">内容（Markdown）</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full rounded-lg border border-border bg-surface-alt px-4 py-3 text-sm text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-colors font-mono"
              rows={20}
              placeholder="## 标题&#10;&#10;在这里写你的 Markdown 内容..."
            />
          </div>
        </div>
      )}
    </div>
  );
}
