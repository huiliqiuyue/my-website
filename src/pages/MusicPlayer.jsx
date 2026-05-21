import { useState, useRef, useEffect, useCallback } from 'react';
import { Link } from 'react-router';

const defaultPlaylist = [
  {
    title: 'Ambient Dream',
    artist: '电子音乐',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
  },
  {
    title: 'Chill Vibes',
    artist: '轻音乐',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
  },
  {
    title: 'Upbeat Energy',
    artist: '流行音乐',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
  },
  {
    title: 'Lo-Fi Beats',
    artist: '嘻哈音乐',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3',
  },
  {
    title: 'Classical Mood',
    artist: '古典音乐',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3',
  },
];

function formatTime(seconds) {
  if (!seconds || !isFinite(seconds)) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

export default function MusicPlayer() {
  const [playlist] = useState(defaultPlaylist);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.7);
  const [isMuted, setIsMuted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const audioRef = useRef(null);
  const animFrameRef = useRef(null);

  const current = playlist[currentIndex];

  const updateProgress = useCallback(() => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
      animFrameRef.current = requestAnimationFrame(updateProgress);
    }
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

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
  }, [currentIndex, isPlaying, volume, isMuted, updateProgress]);

  const togglePlay = () => { setIsPlaying(!isPlaying); };

  const nextTrack = useCallback(() => {
    setCurrentIndex((i) => (i + 1) % playlist.length);
    setIsPlaying(true);
  }, [playlist.length]);

  const prevTrack = () => {
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

  const prog = duration ? (currentTime / duration) * 100 : 0;

  return (
    <div className="mx-auto max-w-md">
      <Link to="/" className="inline-flex items-center gap-1 text-sm text-text-muted hover:text-text transition-colors mb-6">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
        返回首页
      </Link>

      <h1 className="text-2xl font-bold mb-6">音乐播放器</h1>

      {/* Hidden audio element */}
      <audio ref={audioRef} src={current.url} preload="auto" />

      {/* Album Art / Visual */}
      <div className="rounded-2xl bg-gradient-to-br from-primary/30 via-surface to-accent/20 p-8 mb-6 flex items-center justify-center border border-border shadow-lg">
        <div className={`w-40 h-40 rounded-2xl bg-surface-alt border border-border flex items-center justify-center shadow-xl transition-transform duration-500 ${isPlaying ? 'scale-100' : 'scale-[0.92]'}`}>
          <div className={`text-center transition-all duration-300 ${isPlaying ? 'opacity-100' : 'opacity-60'}`}>
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="currentColor" className="mx-auto mb-2 text-primary-light">
              <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55C7.79 13 6 14.79 6 17s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
            </svg>
            {isLoading && (
              <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
            )}
          </div>
        </div>
      </div>

      {/* Track Info */}
      <div className="text-center mb-5">
        <h2 className="text-xl font-semibold text-text">{current.title}</h2>
        <p className="text-sm text-text-muted mt-1">{current.artist}</p>
      </div>

      {/* Progress Bar */}
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
          aria-label={isPlaying ? '暂停' : '播放'}
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
        <button onClick={() => setIsMuted(!isMuted)} className="text-text-muted hover:text-text transition-colors p-1" aria-label="静音">
          {isMuted || volume === 0 ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/></svg>
          ) : volume < 0.5 ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M18.5 12c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM5 9v6h4l5 5V4L9 9H5z"/></svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg>
          )}
        </button>
        <input
          type="range" min="0" max="1" step="0.01"
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
            <button key={i}
              onClick={() => { setCurrentIndex(i); setIsPlaying(true); }}
              className={`w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors ${
                i === currentIndex ? 'bg-primary/10 border border-primary/30' : 'hover:bg-surface-alt border border-transparent'
              }`}
            >
              <span className={`text-xs w-6 text-center font-mono ${i === currentIndex ? 'text-primary-light font-bold' : 'text-text-muted'}`}>
                {i === currentIndex && isPlaying ? (
                  <span className="inline-flex gap-[2px]">
                    <span className="w-[2px] h-3 bg-primary-light rounded-full animate-pulse" />
                    <span className="w-[2px] h-2 bg-primary-light rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} />
                    <span className="w-[2px] h-3 bg-primary-light rounded-full animate-pulse" style={{ animationDelay: '0.4s' }} />
                  </span>
                ) : i === currentIndex ? (
                  '▶'
                ) : (
                  i + 1
                )}
              </span>
              <div className="flex-1 min-w-0">
                <p className={`text-sm truncate ${i === currentIndex ? 'text-primary-light font-medium' : 'text-text'}`}>
                  {track.title}
                </p>
                <p className="text-xs text-text-muted truncate">{track.artist}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
