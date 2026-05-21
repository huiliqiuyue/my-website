import { useState, useRef, useEffect, useCallback } from 'react';
import { Link } from 'react-router';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

function formatTime(seconds) {
  if (!seconds || !isFinite(seconds)) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

export default function MusicPlayer() {
  const { profile } = useAuth();
  const canManage = profile?.role === 'admin' || profile?.role === 'vip';

  const [playlist, setPlaylist] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.7);
  const [isMuted, setIsMuted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loading, setLoading] = useState(true);

  // Add modal state
  const [showAdd, setShowAdd] = useState(false);
  const [addTitle, setAddTitle] = useState('');
  const [addArtist, setAddArtist] = useState('');
  const [addFile, setAddFile] = useState(null);
  const [addUrl, setAddUrl] = useState('');
  const [addMode, setAddMode] = useState('file'); // 'file' | 'url' | 'bilibili'
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState('');

  // Bilibili
  const [bvInput, setBvInput] = useState('');
  const [fetchingBili, setFetchingBili] = useState(false);

  const extractBvid = (input) => {
    const m = input.match(/BV[\w]+/i);
    return m ? m[0] : input.trim();
  };

  const handleBiliFetch = async () => {
    if (!bvInput.trim()) return;
    setFetchingBili(true);
    setAddError('');
    try {
      const bvid = extractBvid(bvInput);
      const CORS_PROXY = 'https://corsproxy.io/?';

      // Fetch video info via CORS proxy
      const infoUrl = `${CORS_PROXY}${encodeURIComponent(`https://api.bilibili.com/x/web-interface/view?bvid=${bvid}`)}`;
      const res = await fetch(infoUrl);
      const json = await res.json();
      if (json.code !== 0) throw new Error(json.message || '获取视频信息失败');

      const { title, owner, cid } = json.data;
      setAddTitle(title);
      setAddArtist(owner?.name || 'B站UP主');

      // Fetch audio stream URL via CORS proxy
      const audioUrl = `${CORS_PROXY}${encodeURIComponent(
        `https://api.bilibili.com/x/player/playurl?bvid=${bvid}&cid=${cid}&fnval=16&fnver=0&fourk=1`
      )}`;
      const audioRes = await fetch(audioUrl);
      const audioJson = await audioRes.json();

      if (audioJson.code === 0 && audioJson.data?.dash?.audio?.length > 0) {
        const rawUrl = audioJson.data.dash.audio[0].baseUrl || audioJson.data.dash.audio[0].base_url || '';
        if (rawUrl) {
          // B站 audio CDN might need referer, so proxy it too
          setAddUrl(`${CORS_PROXY}${encodeURIComponent(rawUrl)}`);
        }
      } else {
        setAddError('未找到音频流，可能是付费或受限内容');
      }
      setFetchingBili(false);
    } catch (err) {
      setAddError('获取失败: ' + (err.message || '网络错误，请检查链接或稍后重试'));
      setFetchingBili(false);
    }
  };

  const audioRef = useRef(null);
  const animFrameRef = useRef(null);

  const fetchPlaylist = useCallback(async () => {
    const { data } = await supabase
      .from('music')
      .select('*')
      .order('created_at', { ascending: false });
    if (data) setPlaylist(data);
    setLoading(false);
  }, []);

  useEffect(() => { fetchPlaylist(); }, [fetchPlaylist]);

  const updateProgress = useCallback(() => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
      animFrameRef.current = requestAnimationFrame(updateProgress);
    }
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || playlist.length === 0) return;

    const onLoaded = () => { setIsLoading(false); setDuration(audio.duration); };
    const onEnded = () => { nextTrack(); };
    const onWaiting = () => { setIsLoading(true); };
    const onCanPlay = () => { setIsLoading(false); };

    audio.addEventListener('loadedmetadata', onLoaded);
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('waiting', onWaiting);
    audio.addEventListener('canplay', onCanPlay);

    if (isPlaying) {
      audio.play().catch(() => setIsPlaying(false));
      animFrameRef.current = requestAnimationFrame(updateProgress);
    } else {
      audio.pause();
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    }

    audio.volume = isMuted ? 0 : volume;

    return () => {
      audio.removeEventListener('loadedmetadata', onLoaded);
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('waiting', onWaiting);
      audio.removeEventListener('canplay', onCanPlay);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [currentIndex, isPlaying, volume, isMuted, updateProgress, playlist.length]);

  const togglePlay = () => { setIsPlaying(!isPlaying); };

  const nextTrack = useCallback(() => {
    if (playlist.length === 0) return;
    setCurrentIndex((i) => (i + 1) % playlist.length);
    setIsPlaying(true);
  }, [playlist.length]);

  const prevTrack = () => {
    if (playlist.length === 0) return;
    if (audioRef.current && audioRef.current.currentTime > 3) {
      audioRef.current.currentTime = 0;
    } else {
      setCurrentIndex((i) => (i - 1 + playlist.length) % playlist.length);
      setIsPlaying(true);
    }
  };

  const seek = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    if (audioRef.current) audioRef.current.currentTime = ratio * duration;
  };

  const handleDelete = async (id) => {
    if (!window.confirm('确认删除这首音乐？')) return;
    const { data: track } = await supabase.from('music').select('url').eq('id', id).single();
    if (track?.url) {
      const path = track.url.split('/').pop();
      if (path) await supabase.storage.from('music').remove([path]);
    }
    await supabase.from('music').delete().eq('id', id);
    fetchPlaylist();
    if (currentIndex >= playlist.length - 1) setCurrentIndex(0);
  };

  const handleAdd = async () => {
    setAddError('');
    if (!addTitle.trim()) { setAddError('请输入歌曲名'); return; }
    setAdding(true);

    try {
      let finalUrl = addUrl;

      if (addMode === 'file' && addFile) {
        const fileExt = addFile.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('music')
          .upload(fileName, addFile);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage.from('music').getPublicUrl(fileName);
        finalUrl = urlData.publicUrl;
      }

      if (!finalUrl) { setAddError('请上传文件或输入URL'); setAdding(false); return; }

      const { error } = await supabase.from('music').insert({
        title: addTitle.trim(),
        artist: addArtist.trim() || '未知',
        url: finalUrl,
        added_by: profile?.id,
      });

      if (error) throw error;

      await fetchPlaylist();
      setShowAdd(false);
      setAddTitle('');
      setAddArtist('');
      setAddFile(null);
      setAddUrl('');
      setBvInput('');
    } catch (err) {
      setAddError(err.message || '添加失败');
    }
    setAdding(false);
  };

  const current = playlist[currentIndex];
  const prog = duration ? (currentTime / duration) * 100 : 0;

  return (
    <div className="mx-auto max-w-md">
      <Link to="/" className="inline-flex items-center gap-1 text-sm text-text-muted hover:text-text transition-colors mb-6">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
        返回首页
      </Link>

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">音乐播放器</h1>
        {canManage && (
          <button onClick={() => setShowAdd(true)}
            className="inline-flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-white hover:bg-primary-dark transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            添加音乐
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>
      ) : playlist.length === 0 ? (
        <div className="text-center py-16 rounded-xl border border-border bg-surface">
          <p className="text-text-muted text-lg mb-2">还没有音乐</p>
          <p className="text-text-muted text-sm">管理员或VIP可以添加音乐</p>
        </div>
      ) : (
        <>
          <audio ref={audioRef} src={current?.url} preload="auto" />

          {/* Album Art */}
          <div className="rounded-2xl bg-gradient-to-br from-primary/30 via-surface to-accent/20 p-8 mb-6 flex items-center justify-center border border-border shadow-lg">
            <div className={`w-40 h-40 rounded-2xl bg-surface-alt border border-border flex items-center justify-center shadow-xl transition-transform duration-500 ${isPlaying ? 'scale-100' : 'scale-[0.92]'}`}>
              <div className={`text-center transition-all duration-300 ${isPlaying ? 'opacity-100' : 'opacity-60'}`}>
                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="currentColor" className="mx-auto mb-2 text-primary-light">
                  <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55C7.79 13 6 14.79 6 17s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
                </svg>
                {isLoading && <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />}
              </div>
            </div>
          </div>

          {/* Track Info */}
          <div className="text-center mb-5">
            <h2 className="text-xl font-semibold text-text">{current?.title || '—'}</h2>
            <p className="text-sm text-text-muted mt-1">{current?.artist || '—'}</p>
          </div>

          {/* Progress */}
          <div className="mb-2 px-2">
            <div className="h-2 bg-surface-alt rounded-full cursor-pointer group relative" onClick={seek}>
              <div className="h-full bg-primary rounded-full transition-all relative" style={{ width: `${prog}%` }}>
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-primary-light rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow" />
              </div>
            </div>
            <div className="flex justify-between mt-1.5">
              <span className="text-xs text-text-muted">{formatTime(currentTime)}</span>
              <span className="text-xs text-text-muted">{formatTime(duration)}</span>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center gap-6 mb-6">
            <button onClick={prevTrack} className="p-2 text-text-muted hover:text-text transition-colors" aria-label="上一首">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/></svg>
            </button>
            <button onClick={togglePlay}
              className="w-14 h-14 rounded-full bg-primary text-white flex items-center justify-center hover:bg-primary-dark transition-all shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 active:scale-95"
            >
              {isPlaying ? (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
              ) : (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
              )}
            </button>
            <button onClick={nextTrack} className="p-2 text-text-muted hover:text-text transition-colors" aria-label="下一首">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/></svg>
            </button>
          </div>

          {/* Volume */}
          <div className="flex items-center justify-center gap-2 mb-8">
            <button onClick={() => setIsMuted(!isMuted)} className="text-text-muted hover:text-text transition-colors p-1">
              {isMuted || volume === 0 ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/></svg>
              ) : volume < 0.5 ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M18.5 12c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM5 9v6h4l5 5V4L9 9H5z"/></svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg>
              )}
            </button>
            <input type="range" min="0" max="1" step="0.01"
              value={isMuted ? 0 : volume}
              onChange={(e) => { setVolume(parseFloat(e.target.value)); setIsMuted(false); }}
              className="w-24 h-1.5 bg-surface-alt rounded-full appearance-none cursor-pointer accent-primary [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary-light"
            />
          </div>

          {/* Playlist */}
          <div>
            <h3 className="text-sm font-semibold text-text mb-3">播放列表</h3>
            <div className="space-y-1">
              {playlist.map((track, i) => (
                <div key={track.id} className={`flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors ${
                  i === currentIndex ? 'bg-primary/10 border border-primary/30' : 'hover:bg-surface-alt border border-transparent'
                }`}>
                  <button onClick={() => { setCurrentIndex(i); setIsPlaying(true); }} className="flex items-center gap-3 flex-1 min-w-0 text-left">
                    <span className={`text-xs w-6 text-center font-mono shrink-0 ${i === currentIndex ? 'text-primary-light font-bold' : 'text-text-muted'}`}>
                      {i === currentIndex && isPlaying ? (
                        <span className="inline-flex gap-[2px]">
                          <span className="w-[2px] h-3 bg-primary-light rounded-full animate-pulse" />
                          <span className="w-[2px] h-2 bg-primary-light rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} />
                          <span className="w-[2px] h-3 bg-primary-light rounded-full animate-pulse" style={{ animationDelay: '0.4s' }} />
                        </span>
                      ) : i === currentIndex ? '▶' : i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm truncate ${i === currentIndex ? 'text-primary-light font-medium' : 'text-text'}`}>{track.title}</p>
                      <p className="text-xs text-text-muted truncate">{track.artist}</p>
                    </div>
                  </button>
                  {canManage && (
                    <button onClick={() => handleDelete(track.id)} className="text-xs text-text-muted hover:text-red-400 transition-colors shrink-0">删除</button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Add Modal */}
      {showAdd && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60" onClick={() => setShowAdd(false)}>
          <div className="bg-surface border border-border rounded-2xl p-6 w-full max-w-md mx-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold mb-4">添加音乐</h2>

            {addError && <div className="mb-4 rounded-lg bg-red-500/10 border border-red-500/30 px-3 py-2 text-xs text-red-400">{addError}</div>}

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-text mb-1">歌曲名</label>
                <input type="text" value={addTitle} onChange={(e) => setAddTitle(e.target.value)}
                  className="w-full rounded-lg border border-border bg-surface-alt px-3 py-2 text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/50 transition-colors"
                  placeholder="歌曲名称" />
              </div>
              <div>
                <label className="block text-xs font-medium text-text mb-1">艺术家</label>
                <input type="text" value={addArtist} onChange={(e) => setAddArtist(e.target.value)}
                  className="w-full rounded-lg border border-border bg-surface-alt px-3 py-2 text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/50 transition-colors"
                  placeholder="艺术家名称" />
              </div>

              {/* Mode tabs */}
              <div className="flex rounded-lg bg-surface-alt p-0.5">
                <button onClick={() => setAddMode('file')} className={`flex-1 py-1.5 text-xs rounded-md transition-colors ${addMode === 'file' ? 'bg-surface text-text shadow-sm' : 'text-text-muted'}`}>上传文件</button>
                <button onClick={() => setAddMode('url')} className={`flex-1 py-1.5 text-xs rounded-md transition-colors ${addMode === 'url' ? 'bg-surface text-text shadow-sm' : 'text-text-muted'}`}>输入链接</button>
                <button onClick={() => setAddMode('bilibili')} className={`flex-1 py-1.5 text-xs rounded-md transition-colors ${addMode === 'bilibili' ? 'bg-surface text-text shadow-sm' : 'text-text-muted'}`}>B站导入</button>
              </div>

              {addMode === 'bilibili' ? (
                <div>
                  <label className="block text-xs text-text-muted mb-1">B站视频链接或 BV 号</label>
                  <div className="flex gap-2">
                    <input type="text" value={bvInput} onChange={(e) => setBvInput(e.target.value)}
                      className="flex-1 rounded-lg border border-border bg-surface-alt px-3 py-2 text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/50 transition-colors"
                      placeholder="https://www.bilibili.com/video/BVxxx 或直接输入 BVxxx" />
                    <button onClick={handleBiliFetch} disabled={fetchingBili || !bvInput.trim()}
                      className="rounded-lg bg-pink-500 px-4 py-2 text-sm font-medium text-white hover:bg-pink-600 transition-colors disabled:opacity-50 shrink-0">
                      {fetchingBili ? '获取中...' : '获取'}
                    </button>
                  </div>
                  <p className="text-xs text-text-muted mt-1">自动获取歌曲名和UP主名，并尝试解析音频流。</p>
                </div>
              ) : addMode === 'file' ? (
                <div>
                  <label className="block text-xs text-text-muted mb-1">音频文件 (mp3/ogg/wav, 最大 20MB)</label>
                  <input type="file" accept="audio/*" onChange={(e) => setAddFile(e.target.files[0])}
                    className="w-full text-sm text-text file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:bg-primary file:text-white hover:file:bg-primary-dark transition-colors" />
                  {addFile && <p className="text-xs text-text-muted mt-1">{addFile.name} ({(addFile.size / 1024 / 1024).toFixed(1)} MB)</p>}
                </div>
              ) : (
                <div>
                  <label className="block text-xs text-text-muted mb-1">音频链接</label>
                  <input type="url" value={addUrl} onChange={(e) => setAddUrl(e.target.value)}
                    className="w-full rounded-lg border border-border bg-surface-alt px-3 py-2 text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/50 transition-colors"
                    placeholder="https://example.com/song.mp3" />
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <button onClick={handleAdd} disabled={adding}
                  className="flex-1 rounded-lg bg-primary py-2 text-sm font-medium text-white hover:bg-primary-dark transition-colors disabled:opacity-50">
                  {adding ? '上传中...' : '添加'}
                </button>
                <button onClick={() => setShowAdd(false)}
                  className="rounded-lg border border-border px-4 py-2 text-sm text-text-muted hover:text-text transition-colors">取消</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
