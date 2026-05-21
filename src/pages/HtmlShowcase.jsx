import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

export default function HtmlShowcase() {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('html_projects')
        .select('*, profiles(display_name, avatar_url)')
        .order('created_at', { ascending: false });
      if (data) setProjects(data);
      setLoading(false);
    })();
  }, []);

  return (
    <div className="mx-auto max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">HTML 作品展</h1>
          <p className="text-text-muted mt-1">用户创作的 HTML 作品，在安全的沙盒环境中展示。</p>
        </div>
        {user && (
          <Link to="/showcase/new"
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            上传作品
          </Link>
        )}
      </div>

      {loading ? (
        <div className="text-center py-16"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" /></div>
      ) : projects.length === 0 ? (
        <div className="text-center py-16 rounded-xl border border-border bg-surface">
          <p className="text-text-muted text-lg mb-2">还没有作品</p>
          <p className="text-text-muted text-sm">登录后上传第一个 HTML 作品吧！</p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2">
          {projects.map((p) => (
            <Link key={p.id} to={`/showcase/${p.id}`}
              className="group block rounded-xl border border-border bg-surface overflow-hidden transition-all hover:border-primary/30 hover:shadow-lg hover:-translate-y-0.5"
            >
              {/* Preview iframe */}
              <div className="h-40 bg-white/5 relative overflow-hidden border-b border-border">
                <iframe
                  srcDoc={p.content}
                  sandbox="allow-scripts"
                  className="w-full h-full pointer-events-none scale-[0.3] origin-top-left"
                  style={{ width: '333%', height: '333%' }}
                  title={p.title}
                />
                <div className="absolute inset-0 bg-transparent" /> {/* click blocker */}
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-text group-hover:text-primary-light transition-colors mb-1">{p.title}</h3>
                {p.description && <p className="text-xs text-text-muted line-clamp-1 mb-2">{p.description}</p>}
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center text-[10px] font-bold text-primary-light overflow-hidden">
                    {p.profiles?.avatar_url ? <img src={p.profiles.avatar_url} alt="" className="w-full h-full object-cover" /> : (p.profiles?.display_name || '?')[0].toUpperCase()}
                  </div>
                  <span className="text-xs text-text-muted">{p.profiles?.display_name || '匿名'}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
