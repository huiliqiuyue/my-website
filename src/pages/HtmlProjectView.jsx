import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

export default function HtmlProjectView() {
  const { id } = useParams();
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fullscreen, setFullscreen] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('html_projects')
        .select('*, profiles(display_name, avatar_url)')
        .eq('id', id)
        .single();
      setProject(data);
      setLoading(false);
    })();
  }, [id]);

  const handleDelete = async () => {
    if (!window.confirm('确认删除这个作品？')) return;
    await supabase.from('html_projects').delete().eq('id', id);
    navigate('/showcase');
  };

  if (loading) {
    return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  }

  if (!project) {
    return (
      <div className="text-center py-20">
        <h1 className="text-2xl font-bold mb-4">作品未找到</h1>
        <Link to="/showcase" className="text-accent hover:text-primary-light transition-colors">&larr; 返回作品展</Link>
      </div>
    );
  }

  const canEdit = user && (user.id === project.author_id || isAdmin);

  return (
    <div className="mx-auto max-w-5xl">
      <Link to="/showcase" className="inline-flex items-center gap-1 text-sm text-text-muted hover:text-text transition-colors mb-4">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
        返回作品展
      </Link>

      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold">{project.title}</h1>
          {project.description && <p className="text-text-muted text-sm mt-1">{project.description}</p>}
          <div className="flex items-center gap-2 mt-2">
            <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center text-[10px] font-bold text-primary-light overflow-hidden">
              {project.profiles?.avatar_url ? <img src={project.profiles.avatar_url} alt="" className="w-full h-full object-cover" /> : (project.profiles?.display_name || '?')[0].toUpperCase()}
            </div>
            <span className="text-xs text-text-muted">{project.profiles?.display_name}</span>
            <span className="text-xs text-text-muted">{new Date(project.created_at).toLocaleDateString('zh-CN')}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setFullscreen(!fullscreen)}
            className="rounded-lg border border-border px-3 py-1.5 text-xs text-text-muted hover:text-text transition-colors"
          >
            {fullscreen ? '退出全屏' : '全屏'}
          </button>
          {canEdit && (
            <>
              <Link to={`/showcase/${id}/edit`}
                className="rounded-lg bg-primary/15 px-3 py-1.5 text-xs text-primary-light hover:bg-primary/25 transition-colors"
              >编辑</Link>
              <button onClick={handleDelete}
                className="rounded-lg bg-red-500/15 px-3 py-1.5 text-xs text-red-400 hover:bg-red-500/25 transition-colors"
              >删除</button>
            </>
          )}
        </div>
      </div>

      {/* Sandboxed iframe */}
      <div className={`rounded-xl border border-border overflow-hidden bg-white transition-all ${fullscreen ? 'fixed inset-0 z-[60] m-0 rounded-none' : 'h-[600px]'}`}>
        <iframe
          srcDoc={project.content}
          sandbox="allow-scripts allow-same-origin"
          className="w-full h-full border-0"
          title={project.title}
        />
      </div>
    </div>
  );
}
