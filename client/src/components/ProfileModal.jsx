import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../AuthContext.jsx';

export default function ProfileModal({ onClose }) {
  const { user, updateUserProfile, getDisplayName, getUsername } = useAuth();

  const [displayName, setDisplayName] = useState(getDisplayName() || '');
  const [username,    setUsername]    = useState(getUsername() || '');
  const [preview,     setPreview]     = useState(user?.photoURL || null);
  const [imageFile,   setImageFile]   = useState(null);
  const [saving,      setSaving]      = useState(false);
  const [uploading,   setUploading]   = useState(false);
  const [error,       setError]       = useState('');
  const [success,     setSuccess]     = useState(false);

  const fileRef = useRef();

  useEffect(() => {
    const handleKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { setError('Image must be under 5MB'); return; }
    setImageFile(file);
    setPreview(URL.createObjectURL(file));
    setError('');
  };

  const handleUsernameChange = (e) => {
    const val = e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, '');
    setUsername(val);
  };

  const uploadToCloudinary = async (file) => {
    setUploading(true);
    const token = await user?.getIdToken(); 

    const formData = new FormData();
    formData.append('file', file);

    const res = await fetch('/upload-avatar', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}` 
      },
      body: formData,
    });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'Image upload failed');
    }

    const data = await res.json();
    setUploading(false);
    return data.url;
  };

  const handleSave = async () => {
    if (!displayName.trim()) return setError('Display name is required');
    if (username && (username.length < 3 || username.length > 20)) {
      return setError('Username must be 3–20 characters');
    }

    setSaving(true);
    setError('');
    try {
      let photoURL = user?.photoURL || null;

      if (imageFile) {
        photoURL = await uploadToCloudinary(imageFile);
      }

      const result = await updateUserProfile({
        displayName: displayName.trim(),
        username:    username.trim(),
        photoURL,
      });

      if (result && !result.success) {
        setError(result.error);
        return;
      }

      setSuccess(true);
      setTimeout(onClose, 1200);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
      setUploading(false);
    }
  };

  const initials = (getDisplayName() || user?.email || 'U')
    .split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/30 backdrop-blur-[8px]"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-md mx-4 bg-surface-container-low border border-outline-variant/20 rounded-[2rem] shadow-ambient overflow-hidden font-body">

        {/* Header */}
        <div className="flex items-center justify-between px-8 py-5 border-b border-outline-variant/10">
          <h2 className="text-on-surface font-headline font-bold text-lg tracking-tight">Edit profile</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors text-xl leading-none"
          >×</button>
        </div>

        {/* Body */}
        <div className="px-8 py-8 space-y-6">

          {/* Avatar */}
          <div className="flex flex-col items-center gap-3">
            <div
              className="relative w-24 h-24 rounded-full cursor-pointer group shadow-sm"
              onClick={() => fileRef.current?.click()}
            >
              {preview ? (
                <img src={preview} alt="Avatar" className="w-24 h-24 rounded-full object-cover border-[3px] border-surface" />
              ) : (
                <div className="w-24 h-24 rounded-full bg-primary-container border-[3px] border-surface flex items-center justify-center text-primary font-bold text-2xl">
                  {initials}
                </div>
              )}
              <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                {uploading ? (
                  <svg className="w-6 h-6 text-white animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                  </svg>
                ) : (
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"/>
                  </svg>
                )}
              </div>
            </div>
            <p className="text-xs font-semibold text-on-surface-variant">Click to upload · max 5MB</p>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
          </div>

          {/* Fields */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-on-surface-variant mb-1.5 uppercase tracking-wide">Display name</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Your name"
                maxLength={40}
                className="w-full bg-surface border border-outline-variant/30 rounded-xl px-4 py-3 text-sm text-on-surface placeholder-outline-variant focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-on-surface-variant mb-1.5 uppercase tracking-wide">Username</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-outline-variant font-medium">@</span>
                <input
                  type="text"
                  value={username}
                  onChange={handleUsernameChange}
                  placeholder="yourhandle"
                  maxLength={20}
                  className="w-full bg-surface border border-outline-variant/30 rounded-xl pl-9 pr-4 py-3 text-sm text-on-surface placeholder-outline-variant focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                />
              </div>
              <p className="mt-1.5 text-xs text-on-surface-variant font-medium">Letters, numbers, _ and - only</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-on-surface-variant mb-1.5 uppercase tracking-wide">Email</label>
              <input
                type="email"
                value={user?.email || ''}
                readOnly
                className="w-full bg-surface-container border border-outline-variant/20 rounded-xl px-4 py-3 text-sm text-on-surface-variant cursor-not-allowed opacity-70"
              />
            </div>
          </div>

          {error && (
            <p className="text-sm font-semibold text-error bg-error-container/30 border border-error/20 rounded-xl px-4 py-3">{error}</p>
          )}
          {success && (
            <p className="text-sm font-semibold text-primary bg-primary-container/30 border border-primary/20 rounded-xl px-4 py-3">
              Profile updated successfully
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="px-8 pb-8 pt-2 flex gap-4">
          <button
            onClick={onClose}
            className="flex-1 py-3.5 rounded-full border border-outline-variant text-sm font-bold text-on-surface hover:bg-outline-variant/10 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || uploading}
            className="flex-1 py-3.5 rounded-full bg-primary text-on-primary text-sm font-bold hover:shadow-[0_8px_20px_rgba(71,100,93,0.3)] hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:hover:translate-y-0 disabled:shadow-none flex items-center justify-center gap-2"
          >
            {saving || uploading ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                </svg>
                {uploading ? 'Uploading...' : 'Saving...'}
              </>
            ) : 'Save changes'}
          </button>
        </div>
      </div>
    </div>
  );
}