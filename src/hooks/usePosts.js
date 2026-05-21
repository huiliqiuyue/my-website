import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export function usePosts({ search, tag, category } = {}) {
  const [allPosts, setAllPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from('posts')
        .select('*, profiles(display_name)')
        .eq('published', true)
        .order('created_at', { ascending: false });

      if (!error && data) {
        setAllPosts(data.map((p) => ({
          ...p,
          author_name: p.profiles?.display_name || 'Unknown',
        })));
      }
      setLoading(false);
    })();
  }, []);

  // Filter (client-side)
  const filtered = allPosts.filter((post) => {
    if (search) {
      const q = search.toLowerCase();
      if (!post.title.toLowerCase().includes(q) && !post.excerpt.toLowerCase().includes(q)) {
        return false;
      }
    }
    if (tag && !(post.tags || []).includes(tag)) return false;
    if (category && post.category !== category) return false;
    return true;
  });

  return {
    posts: filtered,
    loading,
    allTags: [...new Set(allPosts.flatMap((p) => p.tags || []))].sort(),
    allCategories: [...new Set(allPosts.map((p) => p.category || '未分类'))].sort(),
    getPost: (slug) => allPosts.find((p) => p.slug === slug),
  };
}
