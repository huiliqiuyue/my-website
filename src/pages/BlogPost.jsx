import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { readingTime } from '../utils/readingTime';

export default function BlogPost() {
  const { slug } = useParams();
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('posts')
        .select('*, profiles(display_name)')
        .eq('slug', slug)
        .eq('published', true)
        .single();
      setPost(data ? { ...data, author_name: data.profiles?.display_name || 'Unknown' } : null);
      setLoading(false);
    })();
  }, [slug]);

  const handleDelete = async () => {
    if (!window.confirm('确认删除这篇文章？此操作不可恢复。')) return;
    const { error } = await supabase.from('posts').delete().eq('slug', slug);
    if (!error) navigate('/blog');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="text-center py-20">
        <h1 className="text-2xl font-bold mb-4">文章未找到</h1>
        <p className="text-text-muted mb-6">这篇文章不存在或已被移除。</p>
        <Link to="/blog" className="text-accent hover:text-primary-light transition-colors">&larr; 返回博客</Link>
      </div>
    );
  }

  const canEdit = user && (user.id === post.author_id || isAdmin);
  const date = post.created_at
    ? new Date(post.created_at).toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })
    : '';

  return (
    <article className="mx-auto max-w-3xl">
      <Link to="/blog" className="inline-flex items-center gap-1 text-sm text-text-muted hover:text-text transition-colors mb-6">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
        返回博客
      </Link>

      <header className="mb-8">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-primary/15 text-primary-light">{post.category}</span>
          {date && <span className="text-xs text-text-muted">{date}</span>}
          <span className="text-xs text-text-muted">阅读约 {readingTime(post.content)} 分钟</span>
          <span className="text-xs text-text-muted">作者: {post.author_name}</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold mb-4">{post.title}</h1>
        <div className="flex items-center gap-3">
          <div className="flex flex-wrap gap-1.5">
            {(post.tags || []).map((tag) => (
              <Link key={tag} to={`/blog?tag=${tag}`}
                className="text-xs px-2.5 py-1 rounded-md bg-surface-alt text-text-muted hover:text-primary-light transition-colors"
              >#{tag}</Link>
            ))}
          </div>
          {canEdit && (
            <div className="flex gap-1.5 ml-auto">
              <Link to={`/blog/${slug}/edit`}
                className="text-xs px-2.5 py-1 rounded-md bg-primary/15 text-primary-light hover:bg-primary/25 transition-colors"
              >编辑</Link>
              <button onClick={handleDelete}
                className="text-xs px-2.5 py-1 rounded-md bg-red-500/15 text-red-400 hover:bg-red-500/25 transition-colors"
              >删除</button>
            </div>
          )}
        </div>
      </header>

      <div className="prose">
        <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]}>
          {post.content}
        </ReactMarkdown>
      </div>

      <div className="mt-12 pt-8 border-t border-border">
        <Link to="/blog" className="text-accent hover:text-primary-light transition-colors text-sm">
          &larr; 返回文章列表
        </Link>
      </div>
    </article>
  );
}
