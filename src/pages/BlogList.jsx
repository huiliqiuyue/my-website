import { useState } from 'react';
import { Link } from 'react-router';
import { useAuth } from '../contexts/AuthContext';
import { usePosts } from '../hooks/usePosts';
import BlogCard from '../components/BlogCard';

export default function BlogList() {
  const [search, setSearch] = useState('');
  const [selectedTag, setSelectedTag] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const { user } = useAuth();

  const { posts, loading, allTags, allCategories } = usePosts({
    search, tag: selectedTag, category: selectedCategory,
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-3xl font-bold">博客</h1>
        {user && (
          <Link to="/blog/new"
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
            写文章
          </Link>
        )}
      </div>
      <p className="text-text-muted mb-8">技术分享与学习笔记。</p>

      <div className="mb-8 space-y-4">
        <input
          type="text" placeholder="搜索文章..." value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-md rounded-lg border border-border bg-surface-alt px-4 py-2.5 text-sm text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-colors"
        />

        <div className="flex flex-wrap gap-2">
          <button onClick={() => setSelectedCategory('')}
            className={`text-xs font-medium px-3 py-1.5 rounded-full transition-colors ${!selectedCategory ? 'bg-primary text-white' : 'bg-surface-alt text-text-muted hover:text-text hover:bg-border'}`}
          >全部</button>
          {allCategories.map((cat) => (
            <button key={cat} onClick={() => setSelectedCategory(selectedCategory === cat ? '' : cat)}
              className={`text-xs font-medium px-3 py-1.5 rounded-full transition-colors ${selectedCategory === cat ? 'bg-primary text-white' : 'bg-surface-alt text-text-muted hover:text-text hover:bg-border'}`}
            >{cat}</button>
          ))}
        </div>

        <div className="flex flex-wrap gap-1.5">
          {allTags.map((tag) => (
            <button key={tag} onClick={() => setSelectedTag(selectedTag === tag ? '' : tag)}
              className={`text-xs px-2.5 py-1 rounded-md transition-colors ${selectedTag === tag ? 'bg-primary/20 text-primary-light ring-1 ring-primary/40' : 'bg-surface-alt text-text-muted hover:text-text'}`}
            >#{tag}</button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-16">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-text-muted text-sm">加载中...</p>
        </div>
      ) : posts.length > 0 ? (
        <div className="grid gap-5 sm:grid-cols-2">
          {posts.map((post) => (
            <BlogCard key={post.slug} post={post} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <p className="text-text-muted text-lg">没有找到匹配的文章</p>
          <p className="text-text-muted text-sm mt-1">试试调整搜索或筛选条件</p>
        </div>
      )}
    </div>
  );
}
