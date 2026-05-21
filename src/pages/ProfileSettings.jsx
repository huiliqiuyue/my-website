import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

export default function ProfileSettings() {
  const { user, profile, fetchProfile } = useAuth();
  const navigate = useNavigate();

  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState('');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name || '');
      setBio(profile.bio || '');
      setAvatarUrl(profile.avatar_url || '');
      setAvatarPreview(profile.avatar_url || '');
    }
  }, [profile]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setError('图片不能超过 2MB');
      return;
    }
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setMessage('');

    try {
      let finalAvatarUrl = avatarUrl;

      // Upload new avatar if selected
      if (avatarFile) {
        setUploading(true);
        const fileExt = avatarFile.name.split('.').pop();
        const fileName = `${user.id}-${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(fileName, avatarFile, { upsert: true });

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from('avatars')
          .getPublicUrl(fileName);

        finalAvatarUrl = urlData.publicUrl;
        setUploading(false);
      }

      // Update profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          display_name: displayName,
          bio,
          avatar_url: finalAvatarUrl,
        })
        .eq('id', user.id);

      if (updateError) throw updateError;

      await fetchProfile(user.id);
      setAvatarUrl(finalAvatarUrl);
      setAvatarPreview(finalAvatarUrl);
      setAvatarFile(null);
      setMessage('保存成功！');
    } catch (err) {
      setError(err.message || '保存失败');
    } finally {
      setSaving(false);
      setUploading(false);
    }
  };

  return (
    <div className="mx-auto max-w-lg">
      <Link to="/" className="inline-flex items-center gap-1 text-sm text-text-muted hover:text-text transition-colors mb-6">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
        返回首页
      </Link>

      <h1 className="text-2xl font-bold mb-6">个人资料</h1>

      {message && (
        <div className="mb-4 rounded-lg bg-green-500/10 border border-green-500/30 px-4 py-3 text-sm text-green-400">
          {message}
        </div>
      )}
      {error && (
        <div className="mb-4 rounded-lg bg-red-500/10 border border-red-500/30 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Avatar */}
      <div className="mb-6 flex flex-col items-center gap-3">
        <label className="cursor-pointer group relative">
          <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-border group-hover:border-primary/50 transition-colors">
            {avatarPreview ? (
              <img src={avatarPreview} alt="头像" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-surface-alt flex items-center justify-center text-3xl font-bold text-text-muted">
                {(displayName || user?.email || '?')[0].toUpperCase()}
              </div>
            )}
          </div>
          <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
            <span className="text-white text-xs">更换头像</span>
          </div>
          <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
        </label>
        <p className="text-xs text-text-muted">{user?.email}</p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-text mb-1.5">昵称</label>
          <input type="text" value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="w-full rounded-lg border border-border bg-surface-alt px-4 py-2.5 text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/50 transition-colors"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-text mb-1.5">个人简介</label>
          <textarea value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={4}
            className="w-full rounded-lg border border-border bg-surface-alt px-4 py-3 text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/50 transition-colors resize-none"
            placeholder="介绍一下自己..."
          />
        </div>

        <button onClick={handleSave} disabled={saving || uploading}
          className="w-full rounded-lg bg-primary py-2.5 text-sm font-medium text-white hover:bg-primary-dark transition-colors disabled:opacity-50"
        >
          {uploading ? '上传头像中...' : saving ? '保存中...' : '保存'}
        </button>
      </div>
    </div>
  );
}
